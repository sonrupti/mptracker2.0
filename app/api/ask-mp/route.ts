import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, MP } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_STUDIO_API_KEY || ""
);

function normalize(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "");
}

function findMP(mps: MP[], query: string): MP | null {
  const q = normalize(query);

  // Exact/partial constituency match
  const constituencyMatch = mps.find((mp) =>
    normalize(mp.constituency).includes(q)
  );

  if (constituencyMatch) return constituencyMatch;

  // Exact/partial MP name match
  const nameMatch = mps.find((mp) =>
    normalize(mp.name).includes(q)
  );

  if (nameMatch) return nameMatch;

  // State match
  const stateMatches = mps.filter((mp) =>
    normalize(mp.state).includes(q)
  );

  if (stateMatches.length === 1) {
    return stateMatches[0];
  }

  // Word-based matching
  const words = q.split(/\s+/).filter(Boolean);

  let bestMatch: MP | null = null;
  let bestScore = 0;

  for (const mp of mps) {
    const text = normalize(
      `${mp.name} ${mp.constituency} ${mp.state}`
    );

    const score = words.filter((word) =>
      text.includes(word)
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = mp;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    // Get MP data
    const mps = await db.getMps();

    if (!mps.length) {
      return NextResponse.json(
        { error: "MP data is currently unavailable." },
        { status: 503 }
      );
    }

    // Find the MP relevant to the question
    const mp = findMP(mps, question);

    if (!mp) {
      return NextResponse.json({
        answer:
          "I couldn't identify an MP or constituency from your question. Try asking something like: \"How did the MP in Lucknow perform?\"",
      });
    }

    // Existing comparison logic from your database layer
    const comparison = await db.getMpComparison(mp.id);

    // Prepare only the relevant factual data for Gemini
    const mpData = {
      name: mp.name,
      party: mp.party,
      constituency: mp.constituency,
      state: mp.state,
      overall_score: mp.overall_score,
      attendance_rate: mp.attendance_rate,
      questions_count: mp.questions_count,
      debates_count: mp.debates_count,
      bills_sponsored: mp.bills_sponsored,
      bills_passed: mp.bills_passed,
      top_topics: mp.top_topics,
      topic_scores: mp.topic_scores,

      comparison,
    };

    const model = genAI.getGenerativeModel({
     model: "gemini-3.1-flash-lite",
    });

    const prompt = `
You are an AI assistant for an Indian Parliament MP performance tracker.

Your job is to answer the user's question using ONLY the provided database data.

Do NOT invent statistics, rankings, achievements, or facts.

If the data does not contain enough information to answer something, clearly say that the available data does not provide it.

The user asked:

"${question}"

Here is the verified MP data from the database:

${JSON.stringify(mpData, null, 2)}

Instructions:

1. Answer the user's question directly.
2. Explain whether the MP's performance is above, below, or around the relevant average when comparison data is available.
3. Mention the most useful statistics.
4. Keep the answer conversational and easy to understand.
5. Use Indian parliamentary terminology where appropriate.
6. Do not claim that a metric is good or bad without comparing it with an available benchmark.
7. Do not make up missing data.
8. Do not mention that you are an AI unless necessary.
9. Use short paragraphs and bullet points when useful.
10. The answer should feel like a conversational version of the MP's profile page.

Return only the answer text.
`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({
      answer,
      mp: {
        id: mp.id,
        name: mp.name,
        constituency: mp.constituency,
        state: mp.state,
      },
    });
  } catch (error) {
    console.error("ask-mp API error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your question.",
      },
      { status: 500 }
    );
  }
}