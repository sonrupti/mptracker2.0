'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Trophy, Swords, Search } from 'lucide-react';
import { db, MP } from '@/lib/supabase';

export default function ArenaPage() {
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);

  const [mp1Id, setMp1Id] = useState('');
  const [mp2Id, setMp2Id] = useState('');

  const [constituencySearch, setConstituencySearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await db.getMps();
        console.log("Arena data", data.slice(0,5));

        console.log("Arena received:", data.length);
        console.table(data);

        const sorted = [...data].sort(
          (a, b) => b.overall_score - a.overall_score
        );

        setMps(sorted);

        if (sorted.length > 1) {
          setMp1Id(sorted[0].id);
          setMp2Id(sorted[1].id);
        }
      } catch (e) {
        console.error("Arena Error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []); // Extra bracket removed from here

  const mpOfWeek = mps[0];
  const top3 = mps.slice(0, 3);

  const mp1 = mps.find((m) => m.id === mp1Id);
  const mp2 = mps.find((m) => m.id === mp2Id);

  const battleResult = useMemo(() => {
    if (!mp1 || !mp2) return null;

    let score1 = 0;
    let score2 = 0;

    if (mp1.attendance_rate > mp2.attendance_rate) score1++;
    else score2++;

    if (mp1.questions_count > mp2.questions_count) score1++;
    else score2++;

    if (mp1.debates_count > mp2.debates_count) score1++;
    else score2++;

    if (mp1.bills_sponsored > mp2.bills_sponsored) score1++;
    else score2++;

    return {
      score1,
      score2,
      winner: score1 > score2 ? mp1 : mp2,
    };
  }, [mp1, mp2]);

  const findMp = mps.find((mp) =>
    mp.constituency
      .toLowerCase()
      .includes(constituencySearch.toLowerCase())
  );

  function getBadges(mp: MP) {
    const badges = [];

    if (mp.attendance_rate > 90) badges.push('⚡ Attendance Titan');
    if (mp.questions_count > 150) badges.push('❓ Question Champion');
    if (mp.debates_count > 50) badges.push('🎤 Debate Master');
    if (mp.bills_sponsored > 5) badges.push('📜 Bill Architect');

    return badges;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        Loading Arena...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-10">
      {/* MP OF THE WEEK */}
      {mpOfWeek && (
        <section className="rounded-3xl border border-yellow-500/40 bg-linear-to-r from-yellow-500/10 to-indigo-500/10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="text-yellow-400" />
            <h1 className="text-3xl font-bold">MP OF THE WEEK</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={mpOfWeek.image_url}
              alt={mpOfWeek.name}
              className="w-40 h-40 rounded-full object-cover"
            />

            <div>
              <h2 className="text-4xl font-bold">{mpOfWeek.name}</h2>

              <p className="text-muted-foreground">
                {mpOfWeek.party} • {mpOfWeek.constituency}
              </p>

              <div className="mt-4 text-5xl font-bold text-yellow-400">
                {mpOfWeek.overall_score}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>Attendance: {mpOfWeek.attendance_rate}%</div>
                <div>Questions: {mpOfWeek.questions_count}</div>
                <div>Debates: {mpOfWeek.debates_count}</div>
                <div>Bills: {mpOfWeek.bills_sponsored}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PODIUM */}
      <section>
        <h2 className="text-2xl font-bold mb-6">🏆 Top MPs</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {top3.map((mp, index) => (
            <div
              key={mp.id}
              className="rounded-2xl border border-border p-6 bg-card"
            >
              <div className="text-3xl mb-2">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>

              <img
                src={mp.image_url}
                alt={mp.name}
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />

              <h3 className="text-center mt-3 font-bold">{mp.name}</h3>

              <p className="text-center text-muted-foreground text-sm">
                {mp.party}
              </p>

              <p className="text-center text-yellow-400 mt-2 font-bold">
                Score {mp.overall_score}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BATTLE ARENA */}
      <section className="rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Swords />
          <h2 className="text-2xl font-bold">Battle Arena</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            value={mp1Id}
            onChange={(e) => setMp1Id(e.target.value)}
            className="bg-card border border-zinc-700 p-3 rounded-lg text-white"
          >
            {mps.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>

          <select
            value={mp2Id}
            onChange={(e) => setMp2Id(e.target.value)}
            className="bg-card border border-zinc-700 p-3 rounded-lg text-white"
          >
            {mps.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>
        </div>

        {battleResult && (
          <div className="mt-6">
            <div className="text-xl font-bold">
              {battleResult.winner.name} wins
            </div>

            <div className="mt-2 text-muted-foreground">
              Score {battleResult.score1} - {battleResult.score2}
            </div>
          </div>
        )}
      </section>

      {/* FIFA STYLE CARDS */}
      <section>
        <h2 className="text-2xl font-bold mb-6">🎮 MP Cards</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mps.slice(0, 12).map((mp) => (
            <div
              key={mp.id}
              className="rounded-2xl border border-indigo-500/30 bg-card p-5"
            >
              <div className="text-3xl font-bold text-yellow-400">
                {mp.overall_score}
              </div>

              <img
                src={mp.image_url}
                alt={mp.name}
                className="w-24 h-24 rounded-full mx-auto mt-2 object-cover"
              />

              <h3 className="text-center mt-3 font-bold">{mp.name}</h3>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div>ATT {mp.attendance_rate}</div>
                <div>QST {mp.questions_count}</div>
                <div>DEB {mp.debates_count}</div>
                <div>BIL {mp.bills_sponsored}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {getBadges(mp).map((badge) => (
                  <span
                    key={badge}
                    className="text-xs bg-indigo-500/20 px-2 py-1 rounded"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section>
        <h2 className="text-2xl font-bold mb-4">📈 Leaderboard</h2>

        <div className="space-y-2">
          {mps.slice(0, 10).map((mp, index) => (
            <div
              key={mp.id}
              className="flex justify-between items-center bg-card p-4 rounded-lg"
            >
              <div>
                #{index + 1} {mp.name}
              </div>

              <div className="font-bold">{mp.overall_score}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FIND MY MP */}
      <section className="rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search />
          <h2 className="text-2xl font-bold">Find My MP</h2>
        </div>

        <input
          value={constituencySearch}
          onChange={(e) => setConstituencySearch(e.target.value)}
          placeholder="Enter constituency..."
          className="w-full bg-card border border-zinc-700 p-3 rounded-lg text-white"
        />

        {findMp && (
          <div className="mt-6 bg-card p-4 rounded-xl">
            <div className="font-bold text-xl">{findMp.name}</div>

            <div className="text-muted-foreground">
              {findMp.party} • {findMp.constituency}
            </div>

            <div className="mt-2 text-yellow-400 font-bold">
              Score {findMp.overall_score}
            </div>
          </div>
        )}
      </section>
    </div>
  );
} // Correctly closing ArenaPage function at the end