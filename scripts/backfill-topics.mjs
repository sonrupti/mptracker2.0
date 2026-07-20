import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mpData = JSON.parse(fs.readFileSync('../lib/mp-data-enriched.json', 'utf-8'));

async function run() {
  let inserted = 0;
  let skipped = 0;

  for (const mp of mpData) {
    if (!mp.topic_scores) continue;

    const { data: mpRow, error: mpError } = await supabase
      .from('mps')
      .select('id')
      .eq('name', mp.name)
      .eq('constituency', mp.constituency)
      .maybeSingle();

    if (mpError || !mpRow) {
      console.warn(`MP not found: ${mp.name} (${mp.constituency})`);
      skipped++;
      continue;
    }

    const topicRows = Object.entries(mp.topic_scores).map(([topicName, score]) => ({
      mp_id: mpRow.id,
      topic_name: topicName,
      score: Math.min(100, Math.round((score / 10) * 10)),
    }));

    const { error: insertError } = await supabase
      .from('mp_topics')
      .insert(topicRows);

    if (insertError) {
      console.error(`Failed to insert topics for ${mp.name}:`, insertError.message);
    } else {
      inserted += topicRows.length;
      console.log(`Inserted ${topicRows.length} topics for ${mp.name}`);
    }
  }

  console.log('---');
  console.log(`Done. Inserted: ${inserted} topic rows, Skipped: ${skipped} MPs`);
}

run();