'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
];

export default function CategoryPieChart({ data }: Props) {
  return (
    <div className="bg-card border border-border rounded-3xl p-8">

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-2xl font-black">
          Project Category Distribution
        </h2>

        <span className="text-sm text-muted-foreground">
          {data.length} Categories
        </span>

      </div>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No category data available.
        </div>
      ) : (
        <div className="h-96">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                innerRadius={60}
                paddingAngle={3}
                label={({ name, percent }) =>
                  `${name} ${(percent! * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

 <Tooltip
  formatter={(value) => [
    `${Number(value ?? 0)} Projects`,
    'Count',
  ]}
/>

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>
      )}

    </div>
  );
}