-- Create political parties lookup or constraints
-- Parties: Conservative, Labour, SNP, Liberal Democrat, Green, Plaid Cymru, Reform UK, DUP, Sinn Fein, SDLP, Alliance, Independent

-- Create mps table
CREATE TABLE mps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  party VARCHAR(100) NOT NULL,
  constituency VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  email VARCHAR(255),
  website VARCHAR(55),
  twitter VARCHAR(100),
  entered_office DATE,
  status VARCHAR(50) DEFAULT 'Active',
  overall_score NUMERIC(5, 2) DEFAULT 0.00,
  attendance_rate NUMERIC(5, 2) DEFAULT 0.00,
  questions_count INT DEFAULT 0,
  debates_count INT DEFAULT 0,
  bills_sponsored INT DEFAULT 0,
  bills_passed INT DEFAULT 0,
  active_term_years VARCHAR(50),
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance History (for over-time analytics charts)
CREATE TABLE mp_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,
  year INT NOT NULL,
  overall_score NUMERIC(5, 2) NOT NULL,
  attendance_rate NUMERIC(5, 2) NOT NULL,
  questions_count INT NOT NULL,
  debates_count INT NOT NULL,
  bills_sponsored INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mp_id, year)
);

-- MP Topic Focus (for radar/bar interest charts)
CREATE TABLE mp_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,
  topic_name VARCHAR(100) NOT NULL, -- e.g., 'Health', 'Economy', 'Education', 'Defence', 'Climate'
  score INT NOT NULL DEFAULT 0, -- 0 to 100 percentage metric representing intensity of speech/action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mp_id, topic_name)
);

-- Sponsored Bills list

-- Updated Bills Table to match Front-End
CREATE TABLE mp_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,
    title TEXT,                  -- Matches b.title
    bill_number TEXT,
    description TEXT,            -- Matches b.description
    stage TEXT,
    status TEXT,
    house TEXT,
    date_introduced DATE,        -- Matches b.date_introduced
    last_updated DATE,
    bill_pdf TEXT,
    source_url TEXT
);

-- Updated Questions Table to match Front-End
CREATE TABLE mp_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,
    question_number INT,
    session TEXT,
    ministry TEXT,
    category VARCHAR(100),
    question_text TEXT,          -- Matches q.question_text
    response_text TEXT,          -- Matches q.response_text
    date DATE,                   -- Matches q.date
    answer_date DATE,
    question_pdf TEXT,
    answer_pdf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_url TEXT
);
ALTER TABLE mp_questions
ADD COLUMN question_type TEXT,          -- Starred / Unstarred / Short Notice
ADD COLUMN answer_type TEXT,            -- Written / Oral
ADD COLUMN loksabha_session TEXT,
ADD COLUMN parliament_number TEXT,      -- 18th Lok Sabha
ADD COLUMN ministry_name TEXT,
ADD COLUMN full_answer TEXT,
ADD COLUMN keywords TEXT[],
ADD COLUMN source TEXT DEFAULT 'PRS';

-- Updated Debates Table to match Front-End
CREATE TABLE mp_debates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,
    title TEXT,                  -- Matches d.title
    debate_type TEXT,
    ministry TEXT,
    date DATE,                   -- Matches d.date
    duration_minutes INT,
    contributions_count INT DEFAULT 1, -- Matches d.contributions_count
    speech_snippet TEXT,         -- Matches d.speech_snippet
    transcript_url TEXT,
    video_url TEXT
);
ALTER TABLE mp_debates
ADD COLUMN full_transcript TEXT,
ADD COLUMN house TEXT,
ADD COLUMN session TEXT,
ADD COLUMN topic TEXT,
ADD COLUMN prs_url TEXT,
ADD COLUMN source TEXT DEFAULT 'PRS';



CREATE TABLE private_member_bills (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,

    title TEXT,

    status TEXT,

    introduced_on DATE,

    summary TEXT,

    pdf_url TEXT
);
ALTER TABLE mp_bills
ADD COLUMN objective TEXT,
ADD COLUMN key_provisions TEXT,
ADD COLUMN bill_type TEXT,
ADD COLUMN passed_date DATE,
ADD COLUMN withdrawn_date DATE,
ADD COLUMN current_stage TEXT,
ADD COLUMN sponsor_type TEXT,
ADD COLUMN source TEXT DEFAULT 'PRS';
CREATE TABLE mp_votes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mp_id UUID REFERENCES mps(id) ON DELETE CASCADE,

    bill_name TEXT,

    vote TEXT,

    vote_date DATE
);