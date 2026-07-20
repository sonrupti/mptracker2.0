const fs = require('fs');

const CSV_URL =
  'https://raw.githubusercontent.com/Vonter/india-representatives-activity/main/csv/Lok%20Sabha/18th.csv';

//  Ministry 
const TOPIC_MAP = {
  'Economy & Finance':   ['Finance','Commerce And Industry','Corporate Affairs','Statistics And Programme Implementation','Planning','Cooperation','Micro, Small And Medium Enterprises','Skill Development And Entrepreneurship','Textiles','Heavy Industries','Steel','Coal','Mines','Petroleum And Natural Gas','Food Processing Industries'],
  'Agriculture & Rural': ['Agriculture And Farmers Welfare','Rural Development','Fisheries, Animal Husbandry And Dairying','Jal Shakti','Panchayati Raj'],
  'Health & Social':     ['Health And Family Welfare','Women And Child Development','Social Justice And Empowerment','Tribal Affairs','Minority Affairs','Ayush','Labour And Employment'],
  'Infrastructure':      ['Railways','Road Transport And Highways','Civil Aviation','Ports, Shipping And Waterways','Power','Housing And Urban Affairs','Communication','New And Renewable Energy'],
  'Defence & Security':  ['Defence','Home Affairs','External Affairs','Parliamentary Affairs','Personnel, Public Grievances And Pensions'],
  'Education & Science': ['Education','Science And Technology','Electronics And Information Technology','Atomic Energy','Space','Earth Sciences','Youth Affairs And Sports','Culture','Information And Broadcasting','Tourism'],
  'Environment':         ['Environment, Forest And Climate Change','Chemicals And Fertilizers','Development Of North Eastern Region','Law And Justice'],
};

function parseRow(line) {
  return line.split(';').map(v => v.replace(/^"|"$/g, '').trim());
}

function computeScore(attendance, questions, debates, bills) {
  const a = Math.min(parseFloat(attendance) || 0, 100);
  const q = Math.min(parseInt(questions)   || 0, 500);
  const d = Math.min(parseInt(debates)     || 0, 200);
  const b = Math.min(parseInt(bills)       || 0, 20);
  return Math.round((a * 0.35) + (q / 500 * 25) + (d / 200 * 25) + (b / 20 * 15));
}

function getTopicScores(mp, headers) {
  const scores = {};
  for (const [topic, ministries] of Object.entries(TOPIC_MAP)) {
    scores[topic] = ministries.reduce((sum, ministry) => {
      const col = `Questions (${ministry})`;
      const idx = headers.indexOf(col);
      return sum + (idx >= 0 ? (parseFloat(mp[col]) || 0) : 0);
    }, 0);
  }
  return scores;
}

function getTopTopics(topicScores, n = 3) {
  return Object.entries(topicScores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([topic]) => topic);
}

// ── Wikipedia photo fetch ─────────────────────────────────────────────────────
async function fetchWikipediaImage(name) {
  try {
    // Try exact name first
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        titles: name,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: '300',
        redirects: '1',
      }),
      { headers: { 'User-Agent': 'MP-Tracker-Research/1.0 (educational project)' } }
    );
    const json = await res.json();
    const pages = Object.values(json.query?.pages ?? {});
    const page = pages[0];

    if (page && page.thumbnail?.source) {
      return page.thumbnail.source;
    }

    // Try search if exact title didn't work
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `${name} Indian politician`,
        srlimit: '1',
        format: 'json',
      }),
      { headers: { 'User-Agent': 'MP-Tracker-Research/1.0 (educational project)' } }
    );
    const searchJson = await searchRes.json();
    const firstResult = searchJson.query?.search?.[0];

    if (!firstResult) return null;

    // Fetch image for found page
    const imgRes = await fetch(
      `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        titles: firstResult.title,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: '300',
        redirects: '1',
      }),
      { headers: { 'User-Agent': 'MP-Tracker-Research/1.0 (educational project)' } }
    );
    const imgJson = await imgRes.json();
    const imgPages = Object.values(imgJson.query?.pages ?? {});
    return imgPages[0]?.thumbnail?.source ?? null;

  } catch {
    return null;
  }
}

// ── Fallback avatar ───────────────────────────────────────────────────────────
function fallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a5f&color=fff&size=300&bold=true`;
}

async function verifyPrsUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok ? url : '';
  } catch {
    return '';
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📥 Fetching 18th Lok Sabha data...');
  const res  = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  const headers = parseRow(lines[0]);

  console.log(`📊 Found ${lines.length - 1} MPs in CSV`);
  console.log('🖼️  Fetching Wikipedia photos (this takes ~10 mins for all 544 MPs)...');
  console.log('   Tip: You can Ctrl+C and re-run — already-fetched photos are saved incrementally\n');

  // Load existing data if available (so we can resume)
  let existing = {};
  if (fs.existsSync('./lib/mp-data.json')) {
    try {
      const prev = JSON.parse(fs.readFileSync('./lib/mp-data.json', 'utf8'));
      prev.forEach(mp => { existing[mp.name] = mp.image_url; });
      console.log(`♻️  Loaded ${Object.keys(existing).length} existing photos from previous run\n`);
    } catch {}
  }

  const mps = [];
  let photoFound = 0;
  let photoFallback = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const mp  = {};
    headers.forEach((h, idx) => { mp[h] = row[idx] || ''; });

    if (!mp['Name'] || !mp['Constituency']) continue;

    const attendance    = parseFloat((mp['Attendance'] || '0').replace('%', '')) || 0;
    const questions     = parseInt(mp['Questions'])             || 0;
    const debates       = parseInt(mp['Debates'])               || 0;
    const bills         = parseInt(mp['Private Member Bills'])  || 0;
    const topicScores   = getTopicScores(mp, headers);
    const topTopics     = getTopTopics(topicScores);
    const idx           = i - 1;

    // Use cached photo if available, else fetch from Wikipedia
    let image_url;
    if (existing[mp['Name']] && !existing[mp['Name']].includes('ui-avatars')) {
      // Already have a real photo
      image_url = existing[mp['Name']];
      photoFound++;
    } else {
      // Fetch from Wikipedia
      const wikiPhoto = await fetchWikipediaImage(mp['Name']);
      if (wikiPhoto) {
        image_url = wikiPhoto;
        photoFound++;
      } else {
        image_url = fallbackAvatar(mp['Name']);
        photoFallback++;
      }
      // Rate limit: 500ms between Wikipedia API calls
      await sleep(500);
    }

    mps.push({
      id:              `mp-${idx + 1}`,
      name:            mp['Name'],
      constituency:    mp['Constituency'],
      state:           mp['State'],
      region:          mp['State'],
      party:           mp['Party'],
      gender:          mp['Gender'] || '',
      age:             parseInt(mp['Age']) || null,
      education:       mp['Education'] || '',
      is_minister:     mp['Minister'] === 'Yes',
      term:            mp['No. of Term'] || 'First Term',
      start_of_term:   mp['Start of Term'] || '',
      attendance_rate: attendance,
      questions_count: questions,
      debates_count:   debates,
      bills_sponsored: bills,
      overall_score:   computeScore(attendance, questions, debates, bills),
      topic_scores:    topicScores,
      top_topics:      topTopics,
      active_term_years: `${mp['Start of Term']?.slice(6) || '2024'} – Present`,
      ai_summary: `${mp['Name']} is an MP from ${mp['Constituency']}, ${mp['State']}, representing ${mp['Party']}. ` +
        `Top focus areas: ${topTopics.join(', ') || 'general legislation'}. ` +
        `Attendance: ${attendance}% | Questions: ${questions} | Debates: ${debates} | Bills: ${bills}.`,
      image_url,
      prs_url: await verifyPrsUrl(`https://prsindia.org/mptrack/18-lok-sabha/${mp['Name'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`),
      email:'',
      website: '',
      twitter: '',
      status:  'Active' ,
      bills_passed: 0,
    });

    // Save incrementally every 50 MPs so you don't lose progress
    if (idx % 50 === 0 && idx > 0) {
      fs.writeFileSync('./lib/mp-data.json', JSON.stringify(mps, null, 2));
      console.log(`  💾 Saved ${mps.length} MPs... (📸 ${photoFound} photos, 🔲 ${photoFallback} avatars)`);
    }
  }

  // Final save
  fs.mkdirSync('./lib', { recursive: true });
  fs.writeFileSync('./lib/mp-data.json', JSON.stringify(mps, null, 2));

  console.log(`\n✅ Done! Saved ${mps.length} MPs to lib/mp-data.json`);
  console.log(`📸 Wikipedia photos found : ${photoFound}`);
  console.log(`🔲 Avatar fallbacks used  : ${photoFallback}`);
  console.log(`\nRun 'npm run dev' to see your app with real MP photos!`);
}

main().catch(console.error);