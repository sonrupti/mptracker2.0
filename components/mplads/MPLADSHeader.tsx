'use client';

import { MP } from '@/lib/supabase';
import {
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  mp: MP;
}

export default function MPLADSHeader({ mp }: Props) {
  const router = useRouter();

  return (
    <section className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Gold strip */}
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />

      <div className="p-8">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={16} />
          Back to MP
        </button>

        <div className="flex gap-6">

          {/* Avatar */}

          <div className="relative">

            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 p-[3px]">

              <img
                src={mp.image_url || "/placeholder-avatar.png"}
                alt={mp.name}
                className="w-full h-full rounded-full object-cover bg-background"
              />

            </div>

          </div>

          {/* Details */}

          <div className="flex flex-col justify-center">

            <h1 className="text-3xl font-black leading-tight">
              {mp.name}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {mp.party}
            </p>

            <div className="flex items-center gap-2 text-muted-foreground mt-1">

              <MapPin size={15} />

              <span>
                {mp.constituency}, {mp.state}
              </span>

            </div>

            <div className="flex flex-wrap gap-2 mt-4">

              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                {mp.term}
              </span>

              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold">
                Active
              </span>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
