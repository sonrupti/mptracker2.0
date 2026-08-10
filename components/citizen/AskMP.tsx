'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';

export default function AskMP() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setAnswer('');
    setError('');

    try {
      const response = await fetch('/api/ask-mp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setAnswer(data.answer || 'I could not generate an answer.');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to process your question.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Ask about an MP
        </p>
      </div>

      <form
        onSubmit={handleAsk}
        className="relative bg-card border border-border/60 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:border-orange-500/40 transition-all"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something like “How did the MP in Lucknow perform?”"
          rows={3}
          disabled={loading}
          className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-4 pr-14 text-sm font-medium placeholder:text-muted-foreground/50 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-3 bottom-3 h-10 w-10 flex items-center justify-center bg-foreground text-background rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Ask"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      <div className="mt-2 text-[11px] text-muted-foreground">
        Try asking about attendance, questions, debates, bills, or overall
        performance.
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 bg-card border border-border/60 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span>Checking parliamentary data...</span>
            </div>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card border border-red-500/20 rounded-2xl p-4"
          >
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}

        {answer && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold">
                MP Tracker AI
              </span>
            </div>

            <div className="text-sm leading-6 text-foreground whitespace-pre-wrap">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}