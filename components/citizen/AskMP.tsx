'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, X, Trash2, Bot, HelpCircle } from 'lucide-react';
import { PartyLogo } from '@/components/citizen/CitizenUI';
import { useMpAssistant } from '@/context/MpAssistantContext';

// ----------------------------------------------------------------------------
// Types mirroring the API's response shape (app/api/ask-mp/route.ts)
// ----------------------------------------------------------------------------

type QueryIntent =
  | 'mp_profile'
  | 'ranking'
  | 'state_ranking'
  | 'party_ranking'
  | 'party_comparison'
  | 'mp_comparison'
  | 'statistics'
  | 'general';

interface SlimMp {
  id: string;
  name: string;
  constituency: string;
  state: string;
  party: string;
  overall_score: number;
  attendance_rate: number;
  questions_count: number;
  debates_count: number;
  bills_sponsored: number;
  bills_passed: number;
}

interface RankingRow {
  id: string;
  name: string;
  constituency: string;
  state: string;
  party: string;
  value: number;
}

interface Ranking {
  metric: string;
  order: 'asc' | 'desc';
  topValue: number | null;
  tiedForFirstCount: number;
  list: RankingRow[];
}

interface PartyRankingRow {
  party: string;
  mpCount: number;
  average: number;
}

interface ComparisonRow {
  metric: string;
  label: string;
  unit: 'percent' | 'count';
  difference: number;
  leadingMp?: string;
  leadingParty?: string;
  mpAValue?: number;
  mpBValue?: number;
  partyAValue?: number;
  partyBValue?: number;
}

interface AskMpData {
  mp?: SlimMp;
  mps?: SlimMp[];
  ranking?: Ranking;
  parties?: PartyRankingRow[];
  comparison?: ComparisonRow[];
  state?: string;
  party?: string;
  averages?: unknown;
}

interface HistoryTurn {
  question: string;
  answer: string;
  data?: AskMpData | null;
}

interface AskMpResponse {
  answer: string;
  intent: QueryIntent;
  data?: AskMpData | null;
  error?: string;
  code?: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: QueryIntent;
  data?: AskMpData | null;
  isError?: boolean;
}

const MAX_HISTORY = 6;

const SUGGESTED_QUESTIONS = [
  'Who has the highest attendance?',
  'How many MPs have attendance above 90%?',
  'Compare Supriya Sule and Nishikant Dubey.',
  'Top 5 MPs by performance score',
  'Which MP from Odisha has the highest score?',
];

function formatMetricValue(value: number, metricKey: string) {
  if (metricKey === 'attendance_rate') return `${value}%`;
  return `${value}`;
}

// ----------------------------------------------------------------------------
// Small result renderers — kept deliberately compact, matching existing card style
// ----------------------------------------------------------------------------

function MpMiniCard({ mp }: { mp: SlimMp }) {
  return (
    <Link
      href={`/citizen/mp/${mp.id}`}
      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:border-orange-500/40 transition-colors bg-card/60"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <PartyLogo party={mp.party} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{mp.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{mp.constituency}, {mp.state}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-orange-500">{mp.overall_score}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Score</p>
      </div>
    </Link>
  );
}

function RankingList({ ranking }: { ranking: Ranking }) {
  return (
    <div className="space-y-1.5">
      {ranking.list.slice(0, 5).map((row, i) => (
        <Link
          key={row.id}
          href={`/citizen/mp/${row.id}`}
          className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors bg-card/40"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <PartyLogo party={row.party} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{row.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{row.constituency}, {row.state}</p>
            </div>
          </div>
          <span className="text-sm font-black shrink-0 text-orange-500">{formatMetricValue(row.value, ranking.metric)}</span>
        </Link>
      ))}
      {ranking.tiedForFirstCount > 1 && (
        <p className="text-[11px] text-muted-foreground pt-1">
          {ranking.tiedForFirstCount} MPs are tied at the top value.
        </p>
      )}
    </div>
  );
}

function PartyRankingList({ parties }: { parties: PartyRankingRow[] }) {
  return (
    <div className="space-y-1.5">
      {parties.slice(0, 6).map((row, i) => (
        <div key={row.party} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-card/40 border border-border/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <PartyLogo party={row.party} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{row.party}</p>
              <p className="text-[11px] text-muted-foreground">{row.mpCount} MPs</p>
            </div>
          </div>
          <span className="text-sm font-black shrink-0 text-orange-500">{row.average}</span>
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({ mps, comparison }: { mps?: SlimMp[]; comparison: ComparisonRow[] }) {
  const nameA = mps?.[0]?.name ?? 'A';
  const nameB = mps?.[1]?.name ?? 'B';

  return (
    <div className="space-y-1">
      {mps && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {mps.map((mp) => <MpMiniCard key={mp.id} mp={mp} />)}
        </div>
      )}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-card/40">
        {comparison.map((row) => (
          <div key={row.metric} className="flex items-center justify-between gap-2 px-3 py-2 text-xs border-b border-border/40 last:border-b-0">
            <span className="text-muted-foreground shrink-0 w-28 truncate">{row.label}</span>
            <span className="font-bold">{row.mpAValue ?? row.partyAValue ?? '—'}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-bold">{row.mpBValue ?? row.partyBValue ?? '—'}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">{nameA} vs {nameB}</p>
    </div>
  );
}

function ResultPanel({ intent, data }: { intent: QueryIntent; data: AskMpData }) {
  if (intent === 'mp_profile' && data.mp) {
    return <MpMiniCard mp={data.mp} />;
  }
  if ((intent === 'ranking' || intent === 'state_ranking') && data.ranking) {
    return <RankingList ranking={data.ranking} />;
  }
  if (intent === 'party_ranking' && data.parties) {
    return <PartyRankingList parties={data.parties} />;
  }
  if ((intent === 'mp_comparison' || intent === 'party_comparison') && data.comparison) {
    return <ComparisonTable mps={data.mps} comparison={data.comparison} />;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Main Floating Assistant component
// ----------------------------------------------------------------------------

export default function AskMP() {
  const { isOpen, toggleAssistant, closeAssistant, pendingQuestion, clearPendingQuestion } = useMpAssistant();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [showGreeting, setShowGreeting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check localStorage for initial greeting bubble
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('mp_assistant_greeting_dismissed');
      if (!dismissed) {
        setShowGreeting(true);
      }
    } catch {
      setShowGreeting(true);
    }
  }, []);
  useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 20) {
      setShowGreeting(false);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

  const dismissGreeting = () => {
    setShowGreeting(false);
    try {
      localStorage.setItem('mp_assistant_greeting_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Handle pending question from context (e.g., clicked popular question card on homepage)
  useEffect(() => {
    if (pendingQuestion && pendingQuestion.trim()) {
      handleAskText(pendingQuestion.trim());
      clearPendingQuestion();
    }
  }, [pendingQuestion, clearPendingQuestion]);

  const handleAskText = async (textToAsk: string) => {
    const trimmed = textToAsk.trim();
    if (!trimmed || loading) return;

    // Close greeting if open
    if (showGreeting) dismissGreeting();

    const userMsgId = `user-${Date.now()}`;
    const newMsg: MessageItem = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/ask-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: history.slice(-MAX_HISTORY),
        }),
      });

      const data: AskMpResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong processing your request.');
      }

      const finalAnswer = data.answer || 'I could not generate an answer.';
      const assistantMsgId = `assistant-${Date.now()}`;

      const assistantMsg: MessageItem = {
        id: assistantMsgId,
        sender: 'assistant',
        text: finalAnswer,
        intent: data.intent,
        data: data.data ?? null,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      setHistory((prev) =>
        [...prev, { question: trimmed, answer: finalAnswer, data: data.data ?? null }].slice(-MAX_HISTORY)
      );
    } catch (err) {
      console.error(err);
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: err instanceof Error ? err.message : 'Unable to process your question right now.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskText(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* FLOATING BUTTON & INITIAL GREETING BUBBLE                          */}
      {/* ------------------------------------------------------------------ */}
     <div className="fixed bottom-[88px] right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {/* Initial Greeting Bubble */}
        <AnimatePresence>
          {showGreeting && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto max-w-[280px] sm:max-w-[320px] bg-card border border-orange-500/30 rounded-2xl p-4 shadow-2xl relative group"
            >
              <button
                onClick={dismissGreeting}
                className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
                aria-label="Close greeting"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500 mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-foreground">Hi! 👋</p>
                  <p className="text-muted-foreground leading-relaxed">
                    I can answer questions about MPs, attendance, questions, debates, bills and rankings.
                  </p>
                  <button
                    onClick={() => {
                      dismissGreeting();
                      toggleAssistant();
                    }}
                    className="font-bold text-orange-500 hover:text-orange-400 text-[11px] pt-1 inline-flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    Click me to ask a question &rarr;
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating AI Assistant Trigger Button */}
        <motion.button
          onClick={() => {
            if (showGreeting) dismissGreeting();
            toggleAssistant();
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full bg-neutral-900 border border-orange-500/40 text-orange-500 shadow-xl shadow-orange-500/20 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer group"
          aria-label="Ask about an MP"
          title="Ask about an MP"
        >
          {/* Subtle pulse ring when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping opacity-30 pointer-events-none" />
          )}

          {isOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Bot className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
          )}

          {/* Tooltip on desktop */}
          <span className="absolute right-16 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
            Ask about an MP
          </span>
        </motion.button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FLOATING CHAT PANEL                                                */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
           className="fixed bottom-[88px] right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[420px] h-[580px] max-h-[calc(100vh-104px)] bg-neutral-950/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-900/80 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                    ✨ MP Assistant
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Ask anything about MPs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear chat"
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors text-xs flex items-center gap-1"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={closeAssistant}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-medium">
              {/* Empty state with suggested questions */}
              {messages.length === 0 && (
                <div className="space-y-4 my-auto pt-2">
                  <div className="p-3.5 bg-card/60 border border-border/50 rounded-xl space-y-1.5">
                    <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-orange-500" />
                      Welcome to MP Assistant!
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      I have instant access to 18th Lok Sabha public records. Ask me anything about attendance rates, questions asked, bills sponsored, or compare two MPs.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-orange-500" />
                      Suggested questions
                    </p>

                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleAskText(q)}
                          className="w-full text-left p-2.5 rounded-xl bg-card hover:bg-neutral-800 border border-border/60 hover:border-orange-500/40 text-foreground text-xs transition-all active:scale-[0.99] flex items-center justify-between group"
                        >
                          <span>{q}</span>
                          <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl bg-orange-500 text-white font-medium text-xs shadow-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[92%] space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold mb-1">
                        <Sparkles className="h-3 w-3 text-orange-500" />
                        <span>MP Assistant</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                          msg.isError
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-card border-border/60 text-foreground whitespace-pre-wrap'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {msg.intent && msg.data && (
                        <div className="pt-1">
                          <ResultPanel intent={msg.intent} data={msg.data} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Spinner State */}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500 mt-0.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="p-3 bg-card border border-border/60 rounded-2xl text-muted-foreground text-xs flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                    <span>Checking parliamentary data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-neutral-900/80 border-t border-border/60 shrink-0"
            >
              <div className="relative flex items-end bg-card border border-border/70 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:border-orange-500/40 transition-all overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-3 pr-11 text-xs font-medium placeholder:text-muted-foreground/50 disabled:opacity-60 max-h-24"
                />

                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="absolute right-2 bottom-2 h-8 w-8 flex items-center justify-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send question"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <p className="text-[9px] text-muted-foreground text-center mt-2">
                Press Enter to send · Shift+Enter for new line
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
