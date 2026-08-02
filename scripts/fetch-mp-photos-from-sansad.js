/**
 * fetch-mp-photos-from-sansad.js
 *
 * Third pass: uses the official Sansad member code (mpCode) to construct
 * photo URLs directly — no name search, no list-scraping, no guessing.
 *
 * The mpCode -> name mapping comes from a public, CC-BY 4.0 dataset
 * ("Indian parliament proceedings raw dataset: Lok Sabha and Rajya Sabha",
 * Nair 2026, scraped from https://sansad.in/poi/):
 *   https://zenodo.org/records/18146342
 *
 * BEFORE RUNNING:
 *   1. Download "Sansad_details.xlsx" from the link above (60.9 kB) —
 *      my sandbox can't reach zenodo.org directly, so this one step needs
 *      to happen on your machine.
 *   2. Put it in this scripts/ folder, next to this file.
 *   3. npm install xlsx   (one-time, if not already installed)
 *
 * Once a name is matched to its mpCode, the photo URL is:
 *   https://sansad.in/getFile/mpimage/photo/{mpCode}.jpg?source=loksabhadocs
 * This script verifies the URL actually returns an image before writing
 * it — not every mpCode necessarily has an uploaded photo.
 *
 * Same safety guarantees as the other two scripts: only writes
 * `image_url`, only for MPs still on a ui-avatars.com placeholder.
 *
 * Usage:
 *   node scripts/fetch-mp-photos-from-sansad.js --dry-run
 *   node scripts/fetch-mp-photos-from-sansad.js
 *
 * Requires the same .env.local as the other two scripts:
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your env.');
  process.exit(1);
}

const XLSX_PATH = path.join(__dirname, 'Sansad_details.xlsx');
if (!fs.existsSync(XLSX_PATH)) {
  console.error(`❌ Could not find ${XLSX_PATH}`);
  console.error('   Download "Sansad_details.xlsx" from https://zenodo.org/records/18146342');
  console.error('   and place it in this scripts/ folder before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Levenshtein-based fuzzy matcher (same approach as your search page) ────
function levenshtein(a, b) {
  const m = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
  for (let i = 0; i <= b.length; i++) m[i][0] = i;
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + 1);
    }
  }
  return m[b.length][a.length];
}

function similarity(a, b) {
  const distance = levenshtein(a.toLowerCase().trim(), b.toLowerCase().trim());
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - distance / maxLen;
}

function bestSimilarity(a, b) {
  const direct = similarity(a, b);
  const wordsA = a.toLowerCase().split(/\s+/).sort().join(' ');
  const wordsB = b.toLowerCase().split(/\s+/).sort().join(' ');
  return Math.max(direct, similarity(wordsA, wordsB));
}

// ── Load the xlsx and figure out which columns are which ───────────────────
// Column headers aren't guaranteed exact casing/spacing, so we detect them
// by fuzzy-matching header names rather than hardcoding "mpCode" etc.
function loadSansadDetails() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) throw new Error('Sansad_details.xlsx has no rows.');

  const headers = Object.keys(rows[0]);
  const findHeader = (patterns) =>
    headers.find(h => patterns.some(p => h.toLowerCase().replace(/[^a-z]/g, '').includes(p)));

  const nameCol = findHeader(['name']);
  const codeCol = findHeader(['mpcode', 'code']);
  const houseCol = findHeader(['house']);

  if (!nameCol || !codeCol) {
    console.error('   Columns found in the sheet:', headers.join(', '));
    throw new Error('Could not auto-detect name/mpCode columns — check the column names above and adjust findHeader() patterns.');
  }

  console.log(`   Using columns: name="${nameCol}", mpCode="${codeCol}"${houseCol ? `, house="${houseCol}"` : ''}\n`);

  return rows
    .filter(r => !houseCol || String(r[houseCol]).toLowerCase().includes('lok sabha'))
    .map(r => ({ name: String(r[nameCol]).trim(), mpCode: String(r[codeCol]).trim() }))
    .filter(r => r.name && r.mpCode);
}

function findBestMatch(mpName, sansadRows, threshold = 0.82) {
  let best = null;
  let bestScore = 0;
  for (const row of sansadRows) {
    const score = bestSimilarity(mpName, row.name);
    if (score > bestScore) { bestScore = score; best = row; }
  }
  return bestScore >= threshold ? best : null;
}

// ── Verify the constructed URL actually serves an image ─────────────────────
async function verifyImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

function needsPhoto(imageUrl) {
  return !imageUrl || imageUrl.includes('ui-avatars.com');
}

async function main() {
  console.log(DRY_RUN ? '🔍 Dry run — no writes will be made.\n' : '🚀 Fetching + writing real MP photos (Sansad mpCode-based).\n');

  console.log('📖 Loading Sansad_details.xlsx...');
  const sansadRows = loadSansadDetails();
  console.log(`   ${sansadRows.length} Lok Sabha entries loaded.\n`);

  const { data: mps, error } = await supabase.from('mps').select('id, name, image_url').order('name');
  if (error) { console.error('❌ Failed to read from Supabase:', error.message); process.exit(1); }

  const todo = mps.filter(mp => needsPhoto(mp.image_url));
  console.log(`📊 ${mps.length} MPs total, ${todo.length} still on placeholder avatars.\n`);

  let found = 0, stillMissing = 0;

  for (let i = 0; i < todo.length; i++) {
    const mp = todo[i];
    process.stdout.write(`[${i + 1}/${todo.length}] ${mp.name}… `);

    const matched = findBestMatch(mp.name, sansadRows);
    if (!matched) {
      console.log('no confident match in Sansad_details.');
      stillMissing++;
      continue;
    }

    const photoUrl = `https://sansad.in/getFile/mpimage/photo/${matched.mpCode}.jpg?source=loksabhadocs`;
    const valid = await verifyImageUrl(photoUrl);

    if (!valid) {
      console.log(`matched "${matched.name}" (code ${matched.mpCode}) but no image at that URL.`);
      stillMissing++;
      await sleep(300);
      continue;
    }

    found++;

    if (DRY_RUN) {
      console.log(`matched "${matched.name}" → ${photoUrl}`);
    } else {
      const { error: updateError } = await supabase.from('mps').update({ image_url: photoUrl }).eq('id', mp.id);
      if (updateError) {
        console.log(`matched, but DB update failed: ${updateError.message}`);
        found--; stillMissing++;
      } else {
        console.log(`matched "${matched.name}" → updated ✅`);
      }
    }

    await sleep(300);
  }

  console.log(`\n${DRY_RUN ? '🔍 Dry run complete' : '✅ Done'}: ${found} more photo${found !== 1 ? 's' : ''} ${DRY_RUN ? 'found' : 'updated'}, ${stillMissing} still unmatched.`);
}

main();