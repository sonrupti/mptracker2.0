'use client';

import { useMemo, useState } from 'react';

import {
  MPLADSCompleted,
  MPLADSRecommended,
} from '@/lib/supabase';

import {
  Search,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

interface Props {
  recommended: MPLADSRecommended[];
  completed: MPLADSCompleted[];
}

// The raw `work_description` field from the government source is often a
// full free-text request paragraph, not a short project name (e.g. "...the
// festival is scheduled for 12th January. In light of its immense cultural
// and educational value, I humbly request..."). Rendering that whole thing
// as the row's headline is what was blowing up the table's row height.
// We derive a short title by cutting at the first sentence boundary (period
// or comma), capped at ~60 chars, and keep the full text available as a
// clamped secondary line + hover tooltip.
function getProjectTitle(description: string, maxLength = 60): string {
  const firstBoundary = description.search(/[.,]/);
  const candidate =
    firstBoundary > 0 && firstBoundary < maxLength
      ? description.slice(0, firstBoundary)
      : description.slice(0, maxLength);

  return candidate.length < description.length
    ? `${candidate.trim()}…`
    : candidate.trim();
}

function StatusBadge({ status }: { status: 'Completed' | 'Ongoing' }) {
  return status === 'Completed' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 text-xs font-bold whitespace-nowrap">
      <CheckCircle2 size={14} />
      Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 text-xs font-bold whitespace-nowrap">
      <Clock3 size={14} />
      Ongoing
    </span>
  );
}

export default function ProjectsTable({
  recommended,
  completed,
}: Props) {

  const [search, setSearch] = useState('');

  const completedIds = useMemo(
    () => new Set(completed.map((c) => c.work_id)),
    [completed]
  );

  const projects = useMemo(() => {

    return recommended
      .map((item) => ({
        ...item,

        status: completedIds.has(item.work_id)
          ? 'Completed' as const
          : 'Ongoing' as const,
      }))
      .filter((item) =>
        item.work_description
          .toLowerCase()
          .includes(search.toLowerCase())
      );

  }, [recommended, completedIds, search]);

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">

        <div>

          <h2 className="text-xl sm:text-2xl font-black">
            MPLADS Projects
          </h2>

          <p className="text-muted-foreground">
            {projects.length} Projects
          </p>

        </div>

        <div className="relative">

          <Search
            className="absolute left-4 top-3.5 text-muted-foreground"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-11 h-11 rounded-xl border border-border bg-background px-4 w-full lg:w-72 outline-none focus:ring-2 focus:ring-indigo-500"
          />

        </div>

      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border">

        <table className="w-full table-fixed">

          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
          </colgroup>

          <thead className="bg-muted/40">

            <tr>

              <th className="text-left p-4 font-bold">
                Project
              </th>

              <th className="text-left p-4 font-bold">
                Category
              </th>

              <th className="text-left p-4 font-bold">
                Amount
              </th>

              <th className="text-left p-4 font-bold">
                Date
              </th>

              <th className="text-left p-4 font-bold">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {projects.length === 0 && (

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  No projects found.
                </td>

              </tr>

            )}

            {projects.map((project) => (

              <tr
                key={project.id}
                className="border-t border-border hover:bg-muted/30 transition align-top"
              >

                <td className="p-4 align-top" title={project.work_description}>

                  <div className="font-semibold">

                    {getProjectTitle(project.work_description)}

                  </div>

                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">

                    {project.work_description}

                  </div>

                </td>

                <td className="p-4 align-top truncate">

                  {project.category}

                </td>

                <td className="p-4 align-top font-semibold">

                  ₹
                  {project.recommended_amount_rupees.toLocaleString()}

                </td>

                <td className="p-4 align-top">

                  {new Date(
                    project.recommendation_date
                  ).toLocaleDateString()}

                </td>

                <td className="p-4 align-top">

                  <StatusBadge status={project.status} />

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Mobile: card list instead of a squeezed table */}
      <div className="md:hidden space-y-3">

        {projects.length === 0 && (
          <p className="text-center py-12 text-muted-foreground">
            No projects found.
          </p>
        )}

        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-border p-4"
          >

            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-sm leading-snug" title={project.work_description}>
                {getProjectTitle(project.work_description)}
              </h3>
              <StatusBadge status={project.status} />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {project.work_description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="font-bold">
                ₹{project.recommended_amount_rupees.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                {project.category}
              </span>
              <span className="text-muted-foreground">
                {new Date(project.recommendation_date).toLocaleDateString()}
              </span>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}