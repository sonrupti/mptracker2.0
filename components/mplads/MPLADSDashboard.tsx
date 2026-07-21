'use client';

import React, { useMemo } from 'react';

import { MP, MPLADSCompleted, MPLADSExpenditure, MPLADSRecommended } from '@/lib/supabase';

import MPLADSHeader from './MPLADSHeader';
import MPLADSStatCards from './MPLADSStatCards';
import FundGauge from './FundGauge';
import ProjectOverview from './ProjectOverview';
import PerformanceSummary from './PerformanceSummary';
import ProjectsTable from './ProjectsTable';
import CategoryPieChart from './CategoryPieChart';

interface Props {
  mp: MP;
  recommended: MPLADSRecommended[];
  completed: MPLADSCompleted[];
  expenditure: MPLADSExpenditure[];
}

export default function MPLADSDashboard({
  mp,
  recommended,
  completed,
  expenditure,
}: Props) {
    if (
    recommended.length === 0 &&
    completed.length === 0 &&
    expenditure.length === 0
  ) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <h2 className="text-lg font-bold">
          No MPLADS Data Available
        </h2>

        <p className="text-sm text-muted-foreground mt-2">
          Fund utilization and project details are not available for this MP.
        </p>
      </div>
    );
  }

  const summary = useMemo(() => {

    const allocated = recommended.reduce(
      (sum, item) => sum + (item.recommended_amount_rupees || 0),
      0
    );

    const utilized = expenditure.reduce(
      (sum, item) => sum + (item.expenditure_amount_rupees || 0),
      0
    );

    const remaining = Math.max(allocated - utilized, 0);

    const utilization =
      allocated > 0
        ? Number(((utilized / allocated) * 100).toFixed(1))
        : 0;

    const recommendedCount = recommended.length;

    const completedCount = completed.length;

    const ongoingCount = Math.max(
      recommendedCount - completedCount,
      0
    );

    const completionRate =
      recommendedCount > 0
        ? Number(
            ((completedCount / recommendedCount) * 100).toFixed(1)
          )
        : 0;

    return {
      allocated,
      utilized,
      remaining,
      utilization,

      recommendedCount,
      completedCount,
      ongoingCount,
      completionRate,
    };
  }, [recommended, completed, expenditure]);

  const categoryData = useMemo(() => {

    const counts: Record<string, number> = {};

    recommended.forEach((item) => {

  const category = item.category || "Other";

  counts[category] =
    (counts[category] || 0) + 1;

});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));

  }, [recommended]);

  return (
    <div className="space-y-8">

      <MPLADSHeader mp={mp} />

      <MPLADSStatCards summary={summary} />

      <div className="grid lg:grid-cols-2 gap-6">

        <FundGauge utilization={summary.utilization} />

        <ProjectOverview
          completed={summary.completedCount}
          ongoing={summary.ongoingCount}
          recommended={summary.recommendedCount}
        />

      </div>

      <PerformanceSummary summary={summary} />

      <CategoryPieChart data={categoryData} />

      <ProjectsTable
        recommended={recommended}
        completed={completed}
      />

    </div>
  );
}