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
          ? 'Completed'
          : 'Ongoing',
      }))
      .filter((item) =>
        item.work_description
          .toLowerCase()
          .includes(search.toLowerCase())
      );

  }, [recommended, completedIds, search]);

  return (
    <div className="bg-card border border-border rounded-3xl p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>

          <h2 className="text-2xl font-black">
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
            className="pl-11 h-11 rounded-xl border border-border bg-background px-4 w-72 outline-none focus:ring-2 focus:ring-indigo-500"
          />

        </div>

      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">

        <table className="w-full">

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
                className="border-t border-border hover:bg-muted/30 transition"
              >

                <td className="p-4">

                  <div className="font-semibold">

                    {project.work_description}

                  </div>

                </td>

                <td className="p-4">

                  {project.category}

                </td>

                <td className="p-4 font-semibold">

                  ₹
                  {project.recommended_amount_rupees.toLocaleString()}

                </td>

                <td className="p-4">

                  {new Date(
                    project.recommendation_date
                  ).toLocaleDateString()}

                </td>

                <td className="p-4">

                  {project.status === 'Completed' ? (

                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 text-xs font-bold">

                      <CheckCircle2 size={14} />

                      Completed

                    </span>

                  ) : (

                    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 text-xs font-bold">

                      <Clock3 size={14} />

                      Ongoing

                    </span>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}