import { db } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function DebatePage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = await params;

  const debate = await db.getDebateById(debateId);
if (!debate) {
  return <div>Debate not found</div>;
}
  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">{debate.title}</h1>

      <div className="space-y-2 text-gray-600">
        <p><strong>Date:</strong> {debate.date}</p>
        <p><strong>Type:</strong> {debate.debate_type || "N/A"}</p>
        <p><strong>Ministry:</strong> {debate.ministry || "N/A"}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Speech</h2>
        <p>{debate.speech_snippet || "No speech available."}</p>
      </div>
    </main>
  );
}