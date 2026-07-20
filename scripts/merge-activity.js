// scripts/merge-activity.js
// Run: node scripts/merge-activity.js
// This merges real questions/debates/bills from 18th.json into mp-data.json

const fs = require('fs');
const path = require('path');

const mpData = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/mp-data.json'), 'utf-8'));
const activityData = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/18th.json'), 'utf-8'));

function normalize(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Build activity lookup
const activityLookup = {};
activityData.forEach(mp => {
  activityLookup[normalize(mp.Name)] = mp.Activity || {};
});

// Merge into mp-data
const enriched = mpData.map(mp => {
  const activity = activityLookup[normalize(mp.name)] || {};
  
  const questions = (activity.Questions || []).map((q, i) => ({
    id: `q-${mp.id}-${i}`,
    mp_id: mp.id,
    question_text: q.Title || '',
    category: q['Ministry or Category'] || '',
    date: q.Date || '',
    response_text: '',
    source_url: q.link || '',
    type: q.Type || ''
  }));

  const debates = (activity.Debates || []).map((d, i) => ({
    id: `d-${mp.id}-${i}`,
    mp_id: mp.id,
    title: d['Debate title/Bill name'] || '',
    date: d.Date || '',
    debate_type: d['Debate Type'] || '',
    contributions_count: 1,
    speech_snippet: '',
    source_url: d.link || ''
  }));

  const bills = (activity['Private Member Bills'] || []).map((b, i) => ({
    id: `b-${mp.id}-${i}`,
    mp_id: mp.id,
    title: b['Bill title'] || '',
    status: b['Current Status'] || '',
    date_introduced: b['Date of introduction'] || '',
    description: '',
    source_url: b.link || ''
  }));

  return {
    ...mp,
    _questions: questions,
    _debates: debates,
    _bills: bills
  };
});

// Save enriched data
fs.writeFileSync(
  path.join(__dirname, '../lib/mp-data-enriched.json'),
  JSON.stringify(enriched, null, 2)
);

console.log('Done! Enriched', enriched.length, 'MPs');
console.log('Total questions:', enriched.reduce((s, m) => s + m._questions.length, 0));
console.log('Total debates:', enriched.reduce((s, m) => s + m._debates.length, 0));
console.log('Total bills:', enriched.reduce((s, m) => s + m._bills.length, 0));