'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Search, Calendar, Tag } from 'lucide-react';
import { db, MP, MPQuestion } from '@/lib/supabase';

// This MUST be a default export
export default function MpQuestionsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [mp, setMp] = useState<MP | null>(null);
  const [questions, setQuestions] = useState<MPQuestion[]>([]);
  const [search, setSearch] = useState('');

 useEffect(() => {
  async function loadQuestionsData() {
    try {
      console.log("====================================");
      console.log("Route ID:", id);

      const mpData = await db.getMpById(id);

      console.log("MP loaded from DB:", mpData);

      if (!mpData) {
        console.log("No MP found!");
        return;
      }

      setMp(mpData);

      console.log("Calling getMpQuestions...");
      console.log("MP ID being sent:", id);

      const qData = await db.getMpQuestions(id);

      console.log("Questions returned:", qData);
      console.log("Number of questions:", qData.length);

      setQuestions(qData);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
    }
  }

  if (id) {
    loadQuestionsData();
  }
}, [id]);

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(search.toLowerCase()) ||
    (q.response_text?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      {/* Back to Dashboard */}
      <Link
        href={`/mps/${id}`}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-indigo-400 text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to {mp?.name || 'MP'}'s Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-violet-400" />
            Questions Raised
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete legislative question history for {mp?.name} ({mp?.constituency})
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search question text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <Link
  key={q.id}
  href={`/mps/${id}/questions/${q.id}`}
  className="block no-underline"
>
              <div className="p-5 rounded-xl bg-card border border-zinc-900 hover:border-violet-500 hover:bg-card/50 transition-all cursor-pointer space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {q.date || 'Unknown Date'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                    <Tag className="h-2.5 w-2.5" />
                    {q.question_type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    Q: {q.question_text}
                  </h3>
                 
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No matching questions found.
          </div>
        )}
      </div>
    </div>
  );
}