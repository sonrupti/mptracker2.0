import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mpData = JSON.parse(fs.readFileSync('../lib/mp-data-enriched.json', 'utf-8'));

// Fetch all rows from a table, paging past Supabase's default 1000-row limit
async function fetchAll(table, columns) {
  let all = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function run() {
  console.log('Loading all MPs and questions from Supabase...');

  const allMps = await fetchAll('mps', 'id, name, constituency');
  const allQuestions = await fetchAll('mp_questions', 'id, mp_id, question_text, source_url');

  console.log(`Loaded ${allMps.length} MPs and ${allQuestions.length} questions.`);

  // Build lookup: "name|constituency" -> mp uuid
  const mpMap = new Map();
  for (const mp of allMps) {
    mpMap.set(`${mp.name}|${mp.constituency}`, mp.id);
  }

  // Build lookup: "mp_id|question_text" -> question row
  const qMap = new Map();
  for (const q of allQuestions) {
    qMap.set(`${q.mp_id}|${q.question_text}`, q);
  }

  const updates = [];
  let notFoundMp = 0;
  let notFoundQ = 0;
  let alreadyDone = 0;

  for (const mp of mpData) {
    if (!mp._questions) continue;

    const mpId = mpMap.get(`${mp.name}|${mp.constituency}`);
    if (!mpId) {
      notFoundMp++;
      continue;
    }

    for (const q of mp._questions) {
      if (!q.source_url) continue;

      const match = qMap.get(`${mpId}|${q.question_text}`);
      if (!match) {
        notFoundQ++;
        continue;
      }
      if (match.source_url) {
        alreadyDone++;
        continue;
      }

      updates.push({ id: match.id, source_url: q.source_url });
    }
  }
  const seen = new Set();
 const dedupedUpdates = updates.filter(u => {
   if (seen.has(u.id)) return false;
   seen.add(u.id);
   return true;
 });

  console.log(`Prepared ${dedupedUpdates.length} updates. (Already done: ${alreadyDone}, MP not found: ${notFoundMp}, Question not found: ${notFoundQ})`);

  // Push updates in large batches using upsert (only touches id + source_url)
  const batchSize = 500;
  let done = 0;

  for (let i = 0; i < dedupedUpdates.length; i += batchSize) {
    const batch = dedupedUpdates.slice(i, i + batchSize);
    const { error } = await supabase
      .from('mp_questions')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
    } else {
      done += batch.length;
      console.log(`Updated ${done}/${dedupedUpdates.length}`);
    }
  }

  console.log('---');
  console.log(`Done. Updated: ${done}`);
}

run();