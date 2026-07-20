import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config({ path: '../.env.local' });

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FETCH_SIZE = 200;     // how many rows to pull from Supabase per round
const CONCURRENCY = 10;     // how many PDFs to process at the same time
const PAUSE_BETWEEN_CHUNKS_MS = 300; // small pause between concurrent chunks

function extractAnswerText(rawText) {
  const answerIndex = rawText.search(/ANSWER/i);
  if (answerIndex === -1) return null;
  let answer = rawText.slice(answerIndex + 'ANSWER'.length);
  answer = answer.replace(/\s+/g, ' ').trim();
  return answer.length > 0 ? answer : null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processQuestion(row) {
  try {
    const res = await fetch(row.source_url);
    if (!res.ok) {
      console.error(`Failed (${res.status}): ${row.id}`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const answerText = extractAnswerText(parsed.text);

    if (!answerText) {
      console.warn(`No answer in PDF: ${row.id}`);
      return;
    }

    const { error } = await supabase
      .from('mp_questions')
      .update({ answer_text: answerText })
      .eq('id', row.id);

    if (error) {
      console.error(`Save failed for ${row.id}:`, error.message);
    } else {
      console.log(`Saved: ${row.id}`);
    }
  } catch (err) {
    console.error(`Error on ${row.id}:`, err.message);
  }
}

// Split an array into chunks of a given size
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function run() {
  let totalDone = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from('mp_questions')
      .select('id, source_url')
      .is('answer_text', null)
      .not('source_url', 'is', null)
      .limit(FETCH_SIZE);

    if (error) {
      console.error('Failed to fetch rows:', error.message);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('No more questions to process. All done!');
      break;
    }

    console.log(`\nFetched ${rows.length} questions. Processing with concurrency ${CONCURRENCY}...`);

    const chunks = chunk(rows, CONCURRENCY);
    for (const c of chunks) {
      await Promise.all(c.map(row => processQuestion(row)));
      totalDone += c.length;
      console.log(`Progress: ${totalDone} processed so far this run.`);
      await sleep(PAUSE_BETWEEN_CHUNKS_MS);
    }
  }

  console.log(`\nFinished. Total processed this run: ${totalDone}`);
}

run();