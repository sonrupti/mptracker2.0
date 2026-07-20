'use client';

import { useEffect, useState } from 'react';
import { db, StateActivity } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ParliamentActivityCalendarProps {
  stateName: string;
}

function normalizeStateName(state: string) {
  const aliases: Record<string, string> = {
    "orissa": "Odisha",
    "odisha": "Odisha",

    "pondicherry": "Puducherry",
    "puducherry": "Puducherry",

    "j&k": "Jammu and Kashmir",
    "jammu & kashmir": "Jammu and Kashmir",
    "jammu kashmir": "Jammu and Kashmir",
    "jammu and kashmir": "Jammu and Kashmir",
  };

  return aliases[state.trim().toLowerCase()] || state;
}

function getIntensity(score: number) {
  if (score === 0) return 'bg-black/5';
  if (score < 40) return 'bg-red-500';
  if (score < 80) return 'bg-yellow-400';
  if (score < 120) return 'bg-blue-500';
  return 'bg-emerald-500';
}




const WEEKDAYS = [
  'Mon','Tue','Wed','Thu','Fri','Sat','Sun'
];

export default function ParliamentActivityCalendar({
  stateName
}: ParliamentActivityCalendarProps) {

  const [activity, setActivity] = useState<StateActivity[]>([]);
  const [loading, setLoading] = useState(true);


  // ✅ Single hook only
  useEffect(() => {

    async function load() {

      setLoading(true);

      const normalizedState = normalizeStateName(stateName);

      console.log("Calendar state:", normalizedState);

      const data = await db.getStateActivity(normalizedState);

      console.log("Rows:", data.length);

      setActivity(data);
      setLoading(false);
    }

    load();

  }, [stateName]);


  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Loading activity...
      </div>
    );
  }


  const start = new Date('2024-07-01');
  const end = new Date('2026-07-13');
  const monthHeaders: { label: string; week: number }[] = [];
const yearHeaders: { label: string; week: number }[] = [];

let weekIndex = 0;
let lastMonth = -1;
let lastYear = -1;

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  if (d.getDay() === 1) { // Monday = start of a new week
    if (d.getMonth() !== lastMonth) {
      monthHeaders.push({
        label: d.toLocaleString("default", { month: "short" }),
        week: weekIndex,
      });
      lastMonth = d.getMonth();
    }

    if (d.getFullYear() !== lastYear) {
      yearHeaders.push({
        label: d.getFullYear().toString(),
        week: weekIndex,
      });
      lastYear = d.getFullYear();
    }

    weekIndex++;
  }
}

  const map = new Map(
    activity.map((a) => [a.activity_date, a])
  );


  const calendar: (StateActivity | null)[] = [];

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {

    const iso = d.toISOString().split('T')[0];

    calendar.push(
      map.get(iso) || null
    );
  }


  const weeks = [];

  for (
    let i = 0;
    i < calendar.length;
    i += 7
  ) {
    weeks.push(calendar.slice(i, i + 7));
  }


  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-5 sm:mb-6">

        <h2 className="text-lg sm:text-2xl font-black text-foreground">
          Parliamentary Activity
        </h2>

        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          {normalizeStateName(stateName)}
        </span>

      </div>


      <div className="flex">

        <div className="flex flex-col gap-[2px] sm:gap-[3px] mr-2 sm:mr-4 mt-8 text-[10px] sm:text-xs text-muted-foreground shrink-0">

          {WEEKDAYS.map(day => (
            <span key={day}>
              {day}
            </span>
          ))}

        </div>


        <div className="flex-1 min-w-0 overflow-x-auto">

          <div className="inline-block min-w-max">


           {/* Years */}
<div className="relative h-5 mb-1">
  {yearHeaders.map((year) => (
    <span
      key={year.label}
      className="absolute text-xs sm:text-sm font-bold text-foreground"
      style={{
        left: `${year.week * 16}px`,
      }}
    >
      {year.label}
    </span>
  ))}
</div>

{/* Months */}
<div className="relative h-4 mb-3">
  {monthHeaders.map((month, i) => (
    <span
      key={i}
      className="absolute text-[10px] sm:text-xs text-muted-foreground"
      style={{
        left: `${month.week * 16}px`,
      }}
    >
      {month.label}
    </span>
  ))}
</div>


            <div className="flex gap-[2px] sm:gap-[3px]">

              {weeks.map((week, wi) => (

                <div
                  key={wi}
                  className="flex flex-col gap-[2px] sm:gap-[3px]"
                >

                  {week.map((day, di) => (

                    <div
                      key={di}
                      title={
                        day
                          ? `${day.activity_date}

Questions: ${day.questions}
Debates: ${day.debates}
Bills: ${day.bills}
Attendance: ${day.attendance}%`
                          : ''
                      }

                      className={cn(
                        'w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm transition-all hover:scale-125 border border-border/30',

                        day
                          ? getIntensity(day.activity_score)
                          : 'bg-black/5'
                      )}
                    />

                  ))}

                </div>

              ))}

            </div>


          </div>

        </div>

      </div>


      <div className="flex items-center gap-1.5 sm:gap-2 mt-5 sm:mt-6 text-[10px] sm:text-xs text-muted-foreground flex-wrap">

        <span>
          Less
        </span>

        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-black/5" />
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-500" />
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-yellow-400" />
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-blue-500" />
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-emerald-500" />

        <span>
          More
        </span>

      </div>

    </div>
  );
}