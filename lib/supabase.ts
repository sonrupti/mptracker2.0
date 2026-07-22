import { createClient } from '@supabase/supabase-js';

export interface MP {
  id: string;
  name: string;
  party: string;
  constituency: string;
  state: string;
  region: string;        // keep for compatibility (same as state)
  image_url: string;
  gender: string;
  age: number | null;
  education: string;
  is_minister: boolean;
  term: string;
  start_of_term: string;
  status: 'Active' | 'Inactive';
  overall_score: number;
  attendance_rate: number;
  questions_count: number;
  debates_count: number;
  bills_sponsored: number;
  bills_passed: number;
  active_term_years: string;
  ai_summary: string;
  prs_url: string;
  top_topics: string[];
  topic_scores: Record<string, number>;
}

export interface MPPerformanceHistory {
  id: string;
  mp_id: string;
  year: number;
  overall_score: number;
  attendance_rate: number;
  questions_count: number;
  debates_count: number;
  bills_sponsored: number;
}

export interface MPTopic {
  id: string;
  mp_id: string;
  topic_name: string;
  score: number; // 0 to 100
}

export interface MPBill {
  id: string;
  mp_id: string;
  title: string;
  prs_bill_page_url: string;

  description?: string | null;
  status?: string | null;
  date_introduced?: string | null;
}

export interface MPQuestion {
  id: string;
  mp_id: string;
  question_number?: number;
  question_type?: string;
  answer_type?: string;
  ministry?: string;
  ministry_name?: string;
  session?: string;
  loksabha_session?: string;
  parliament_number?: string;
  category: string;
  question_text: string;
  response_text?: string;
  full_answer?: string;
  date: string;
  answer_date?: string;
  question_pdf?: string;
  answer_pdf?: string;
  source_url?: string;
  prs_url?: string;
  keywords?: string[];
  official_url?: string;
  link?: string;
}

export interface MPDebate {
  id: string;
  mp_id: string;
  title: string;
  debate_type?: string;
  ministry?: string;
  topic?: string;
  session?: string;
  house?: string;
  date: string;
  contributions_count: number;
  speech_snippet?: string;
  full_transcript?: string;
  transcript_url?: string;
  video_url?: string;
  prs_url?: string;
}
export interface StateActivity {
  id: string;
  state: string;
  activity_date: string;
  questions: number;
  debates: number;
  bills: number;
  attendance: number;
  activity_score: number;
}



export interface MPLADSRecommended {
  id: number;
  work_id: string;
  work_description: string;
  category: string;
  mp_name: string;
  constituency: string;
  state: string;
  house: string;
  recommended_amount_rupees: number;
  recommendation_date: string;
  has_images: boolean;
  ida: string;
}
export interface MPLADSCompleted {
  id: number;
  work_id: string;
  work_description: string;
  category: string;
  mp_name: string;
  constituency: string;
  state: string;
  house: string;
  final_amount_rupees: number;
  completed_date: string;
  has_images: boolean;
  average_rating: number;
  ida: string;
}
export interface MPLADSExpenditure {
  id: number;
  mp_name: string;
  constituency: string;
  state: string;
  house: string;
  work_description: string;
  vendor: string;
  ida: string;
  expenditure_amount_rupees: number;
  expenditure_date: string;
  payment_status: string;
}
// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Live Supabase Client (only created if variables exist)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
  // Normalize MP names for better matching
function normalizeName(name: string) {
  return name
    ?.toLowerCase()
    .replace(/[^a-z]/g, "") || "";
}

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseAnonKey);
console.log("Supabase client created:", !!supabase);

// ==========================================
// REAL DATA — 18th Lok Sabha (544 MPs)
// ==========================================
import mpDataRaw from './mp-data-enriched.json';

const MOCK_MPS: MP[] = (mpDataRaw as any[]).map(mp => ({
  ...mp,
  region: mp.state,                          // alias for compatibility
  status: 'Active' as const,
  bills_passed: 0,                           // not in source data
  active_term_years: `${mp.start_of_term?.slice(6) || '2024'} – Present`,
  ai_summary: `${mp.name} is an MP from ${mp.constituency}, ${mp.state}, representing ${mp.party}. `
    + `Their top focus areas are ${(mp.top_topics as string[]).join(', ') || 'general legislation'}. `
    + `Attendance: ${mp.attendance_rate}% | Questions: ${mp.questions_count} | Debates: ${mp.debates_count} | Bills: ${mp.bills_sponsored}.`,
}));

const MOCK_HISTORIES: MPPerformanceHistory[] = [];
const MOCK_TOPICS: MPTopic[] = [];

// Seed topics from real topic_scores data
MOCK_MPS.forEach(mp => {
  if (mp.topic_scores) {
    Object.entries(mp.topic_scores).forEach(([topic, score], tIdx) => {
      MOCK_TOPICS.push({
        id: `topic-${mp.id}-${tIdx}`,
        mp_id: mp.id,
        topic_name: topic,
        score: Math.min(100, Math.round(((score as number) / 10) * 10)), // normalize
      });
    });
  }
});

// ==========================================
// DATA ACCESS LAYER (Fallback Enabled)
// ==========================================
export const db = {
  /**
   * Get list of all MPs with search and filter options
   */
  async getStateActivity(state: string): Promise<StateActivity[]> {
    if (!supabase) return [];

    const dbState =
      state === "Orissa"
        ? "Odisha"
        : state;

    const { data, error } = await supabase
      .from("state_activity")
      .select("*")
      .eq("state", dbState)
      .order("activity_date", { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return data as StateActivity[];
  },

  
 async getMPLADSRecommended(mpId: string): Promise<MPLADSRecommended[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mplads_recommended")
    .select("*")
    .eq("mp_id", mpId)
    .eq("house", "Lok Sabha");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
},
async getMPLADSCompleted(mpId: string): Promise<MPLADSCompleted[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mplads_completed")
    .select("*")
    .eq("mp_id", mpId)
    .eq("house", "Lok Sabha");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
},
async getMPLADSExpenditure(mpId: string): Promise<MPLADSExpenditure[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mplads_expenditure")
    .select("*")
    .eq("mp_id", mpId)
    .eq("house", "Lok Sabha");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
},
  async getMps(filters?: {
    search?: string;
    party?: string;
    region?: string;
    minScore?: number;
    maxScore?: number;
    status?: string;
    sortBy?: 'overall_score' | 'attendance_rate' | 'questions_count' | 'debates_count' | 'bills_sponsored';
    sortOrder?: 'asc' | 'desc';
  }) {
    if (supabase) {
      try {
        let query = supabase.from('mps').select('*');

        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,constituency.ilike.%${filters.search}%`);
        }
        if (filters?.party && filters.party !== 'All') {
          query = query.ilike('party', `%${filters.party}%`);
        }
        if (filters?.region && filters.region !== 'All') {

          const regionAliases: Record<string, string[]> = {
            Odisha: ['Odisha', 'Orissa'],
            Puducherry: ['Puducherry', 'Pondicherry'],
            'Jammu and Kashmir': [
              'Jammu and Kashmir',
              'Jammu & Kashmir',
              'J&K',
              'Jammu Kashmir'
            ],
          };

          const regions =
            regionAliases[filters.region] || [filters.region];

          query = query.in('region', regions);
        }
        if (filters?.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }
        if (filters?.minScore !== undefined) {
          query = query.gte('overall_score', filters.minScore);
        }
        if (filters?.maxScore !== undefined) {
          query = query.lte('overall_score', filters.maxScore);
        }

        const sortBy = filters?.sortBy || 'overall_score';
        const sortOrder = filters?.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        const { data, error } = await query;

        console.log("========== getMps ==========");
        console.log("Supabase Error:", error);
        console.log("Rows Returned:", data?.length);
        console.table(data?.slice(0, 5));
        if (!error && data) {
          return data.map((mp: any) => ({ ...mp, state: mp.region })) as MP[];
        }
      } catch (err) {
        console.error('Supabase query error, falling back to mock:', err);
      }
    }

    // Mock implementation
    let result = [...MOCK_MPS];

   if (filters?.search) {
  const searchNormalized = normalizeName(filters.search);

  result = result.filter(
    mp =>
      normalizeName(mp.name).includes(searchNormalized) ||
      mp.constituency.toLowerCase().includes(filters.search!.toLowerCase()) ||
      mp.region.toLowerCase().includes(filters.search!.toLowerCase())
  );
}

    if (filters?.party && filters.party !== 'All') {
      result = result.filter(mp => mp.party.toLowerCase().includes(filters.party!.toLowerCase()));
    }

    if (filters?.region && filters.region !== 'All') {
      const regionAliases: Record<string, string[]> = {
        Odisha: ['Odisha', 'Orissa'],
        Puducherry: ['Puducherry', 'Pondicherry'],
        'Jammu and Kashmir': [
          'Jammu and Kashmir',
          'Jammu & Kashmir',
          'J&K',
          'Jammu Kashmir'
        ],
      };

      const regions = regionAliases[filters.region] || [filters.region];
      result = result.filter(mp => regions.includes(mp.region));
    }

    if (filters?.status && filters.status !== 'All') {
      result = result.filter(mp => mp.status === filters.status);
    }

    if (filters?.minScore !== undefined) {
      result = result.filter(mp => mp.overall_score >= filters.minScore!);
    }

    if (filters?.maxScore !== undefined) {
      result = result.filter(mp => mp.overall_score <= filters.maxScore!);
    }

    const sortBy = filters?.sortBy || 'overall_score';
    const sortOrder = filters?.sortOrder || 'desc';
    result.sort((a, b) => {
      const valA = a[sortBy] as string | number;
      const valB = b[sortBy] as string | number;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  },

  /**
   * Get a single MP by ID
   */
  async getMpById(id: string) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('mps').select('*').eq('id', id).single();
        if (!error && data) return { ...data, state: data.region } as MP;
        console.error('Supabase getMpById error, falling back to mock:', error);
      } catch (err) {
        console.error('Supabase query error, falling back to mock:', err);
      }
    }

    return MOCK_MPS.find(mp => mp.id === id) || null;
  },

  /**
   * Get an MP's performance history
   */
  async getMpHistory(mpId: string) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('mp_performance_history').select('*').eq('mp_id', mpId).order('year', { ascending: true });
        if (!error && data) return data as MPPerformanceHistory[];
        console.error('Supabase getMpHistory error, falling back to mock:', error);
      } catch (err) {
        console.error('Supabase query error, falling back to mock:', err);
      }
    }

    return MOCK_HISTORIES.filter(h => h.mp_id === mpId).sort((a, b) => a.year - b.year);
  },

  /**
   * Get an MP's topic breakdown scores
   */
  async getMpTopics(mpId: string) {
    if (supabase) {
      const { data } = await supabase
        .from("mp_topics")
        .select("*")
        .eq("mp_id", mpId);

      return data || [];
    }

    return [];
  },

  /**
   * Get MP comparison — this MP vs state average vs India average
   */
  async getMpComparison(mpId: string) {
    const allMps = await this.getMps();
    const mp = allMps.find(m => m.id === mpId);
    if (!mp) return null;

    const stateMps = allMps.filter(m => m.state === mp.state);
    const indiaMps = allMps;

    const avg = (arr: MP[], key: keyof MP) =>
      Number((arr.reduce((acc, m) => acc + (m[key] as number), 0) / arr.length).toFixed(1));

    return {
      mp: {
        attendance_rate: mp.attendance_rate,
        questions_count: mp.questions_count,
        debates_count: mp.debates_count,
        bills_sponsored: mp.bills_sponsored,
      },
      state: {
        label: mp.state,
        attendance_rate: avg(stateMps, 'attendance_rate'),
        questions_count: avg(stateMps, 'questions_count'),
        debates_count: avg(stateMps, 'debates_count'),
        bills_sponsored: avg(stateMps, 'bills_sponsored'),
      },
      party: {
        label: mp.party,
        attendance_rate: avg(allMps.filter(m => m.party === mp.party), 'attendance_rate'),
        questions_count: avg(allMps.filter(m => m.party === mp.party), 'questions_count'),
        debates_count: avg(allMps.filter(m => m.party === mp.party), 'debates_count'),
        bills_sponsored: avg(allMps.filter(m => m.party === mp.party), 'bills_sponsored'),
      },
      india: {
        attendance_rate: avg(indiaMps, 'attendance_rate'),
        questions_count: avg(indiaMps, 'questions_count'),
        debates_count: avg(indiaMps, 'debates_count'),
        bills_sponsored: avg(indiaMps, 'bills_sponsored'),
      },
    };
  },

  /**
   * Get an MP's bills
   */
  async getMpBills(mpId: string) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('mp_bills').select('*').eq('mp_id', mpId).order('date_introduced', { ascending: false });
        if (!error && data) return data as MPBill[];
        console.error('Supabase getMpBills error, falling back to mock:', error);
      } catch (err) {
        console.error('Supabase query error, falling back to mock:', err);
      }
    }

    const mp = MOCK_MPS.find(m => m.id === mpId) as any;
    return (mp?._bills || []).sort((a: any, b: any) => b.date_introduced.localeCompare(a.date_introduced));
  },

  async getBillById(billId: string) {
    if (supabase) {
      const { data } = await supabase
        .from("mp_bills")
        .select("*")
        .eq("id", billId)
        .single();

      return data;
    }

    return null;
  },

  /**
   * Get an MP's questions
   */
  async getMpQuestions(mpId: string) {
    console.log("====================================");
    console.log("getMpQuestions() CALLED");
    console.log("Searching questions for mp_id:", mpId);

    if (!supabase) return [];

    const { data, error } = await supabase
      .from("mp_questions")
      .select("*")
      .eq("mp_id", mpId);

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Rows returned:", data?.length);
      console.log("Questions:", data);
    }

    return data || [];
  },

  async getQuestionById(questionId: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("mp_questions")
        .select("*")
        .eq("id", questionId)
        .single();

      console.log("Question:", data);

      if (error) {
        console.error("Question error:", error.message, error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("getQuestionById exception:", err);
      return null;
    }
  },

  /**
   * Get an MP's debates
   */
  async getMpDebates(mpId: string) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("mp_debates")
          .select("*")
          .eq("mp_id", mpId)
          .order("date", { ascending: false });

        if (error) {
          console.error("mp_debates:", error.message, error);
        } else {
          console.log("Debates:", data);
          return data as MPDebate[];
        }
      } catch (err) {
        console.error("getMpDebates exception:", err);
      }
    }

    const mp = MOCK_MPS.find((m) => m.id === mpId) as any;
    return (mp?._debates || []).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );
  },

  async getDebateById(debateId: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("mp_debates")
        .select("*")
        .eq("id", debateId)
        .single();

      console.log("Debate:", data);

      if (error) {
        console.error("Debate error:", error.message, error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("getDebateById exception:", err);
      return null;
    }
  },

  /**
   * Get aggregated insights for home page
   */
  async getAggregatedInsights() {
    const mps = await this.getMps();
    const activeMps = mps.filter(m => m.status === 'Active');

    const avgAttendance = activeMps.reduce((acc, curr) => acc + curr.attendance_rate, 0) / activeMps.length;
    const avgScore = activeMps.reduce((acc, curr) => acc + curr.overall_score, 0) / activeMps.length;
    const totalQuestions = mps.reduce((acc, curr) => acc + curr.questions_count, 0);
    const totalDebates = mps.reduce((acc, curr) => acc + curr.debates_count, 0);
    const totalBills = mps.reduce((acc, curr) => acc + curr.bills_sponsored, 0);
    const totalBillsPassed = mps.reduce((acc, curr) => acc + curr.bills_passed, 0);

    // Group by Party
    const partyStats: { [key: string]: { count: number; totalScore: number; avgScore: number } } = {};
    activeMps.forEach(mp => {
      if (!partyStats[mp.party]) {
        partyStats[mp.party] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      partyStats[mp.party].count += 1;
      partyStats[mp.party].totalScore += mp.overall_score;
    });

    Object.keys(partyStats).forEach(party => {
      partyStats[party].avgScore = Number((partyStats[party].totalScore / partyStats[party].count).toFixed(1));
    });

    return {
      avgAttendance: Number(avgAttendance.toFixed(1)),
      avgScore: Number(avgScore.toFixed(1)),
      totalQuestions,
      totalDebates,
      totalBills,
      totalBillsPassed,
      partyStats: Object.keys(partyStats).map(name => ({
        name,
        count: partyStats[name].count,
        avgScore: partyStats[name].avgScore
      }))
    };
  }
};