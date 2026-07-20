'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Search,
} from 'lucide-react';

import { db, MPBill } from '@/lib/supabase';

export default function MpBillsPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<MPBill[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadBills() {
      setLoading(true);

      try {
        const data = await db.getMpBills(id);
        setBills(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadBills();
  }, [id]);

  const filteredBills = useMemo(() => {
    const value = search.toLowerCase();

    return bills.filter((bill) =>
      bill.title.toLowerCase().includes(value)
    );
  }, [bills, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      <Link
        href={`/mps/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to MP Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bills Sponsored
        </h1>

        <p className="text-muted-foreground mt-1">
          {bills.length} Bills
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

        <input
          placeholder="Search bills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-4">

        {filteredBills.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No bills found.
          </div>
        )}

        {filteredBills.map((bill) => (

          <div
            key={bill.id}
            className="rounded-xl border border-border bg-card p-5 hover:border-indigo-500 hover:bg-card transition"
          >

            <div className="flex items-start gap-4">

              <div className="p-3 rounded-lg bg-amber-500/10">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>

              <div className="flex-1">

                <h2 className="text-lg font-semibold text-foreground">
                  {bill.title}
                </h2>

                <p className="text-sm text-muted-foreground mt-2">
                  No description available.
                </p>

                <div className="flex gap-4 mt-4">

                  <Link
                    href={`/mps/${id}/bills/${bill.id}`}
                    className="text-sm text-amber-400 hover:underline"
                  >
                    View Details →
                  </Link>

                  <a
                    href={bill.prs_bill_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-400 hover:underline"
                  >
                    View on PRS ↗
                  </a>

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}