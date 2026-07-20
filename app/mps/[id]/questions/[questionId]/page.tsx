import { db } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, FileText, Landmark } from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
}

export default async function QuestionDetailsPage({ params }: Props) {
  const { id, questionId } = await params;
console.log("Question ID from URL:", questionId);
  const question = await db.getQuestionById(questionId);

  if (!question) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6 text-foreground">
      <Link
        href={`/mps/${id}/questions`}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-indigo-400 text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Questions</span>
      </Link>

      <div className="space-y-3 border-b border-zinc-900 pb-5">
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {question.date || "Unknown Date"}
          </span>
          {question.question_type && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
              <Tag className="h-2.5 w-2.5" />
              {question.question_type}
            </span>
          )}
          {(question.ministry_name || question.ministry) && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Landmark className="h-3 w-3" />
              {question.ministry_name || question.ministry}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground leading-snug">
          {question.question_text}
        </h1>
      </div>

      <div className="text-sm text-muted-foreground italic">
        Answer text isn't available in this dataset yet.
      </div>

     {question.source_url && (
  <a
    href={question.source_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
  >
    <FileText className="h-3.5 w-3.5" />
    View Original Source
  </a>
)}
    </div>
  );
}