/**
 * Shared math for the wireframe's "how this compares" histograms and
 * percentile badges. Used by any metric detail view (attendance, questions,
 * debates, MPLAD) that needs to show where one MP sits among all MPs.
 */

export interface DistributionBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  isThisMpBucket: boolean;
}

export interface Distribution {
  percentile: number;
  buckets: DistributionBucket[];
  thisMpBucketIndex: number;
}

/**
 * Buckets `values` into `bucketCount` equal-width ranges and marks which
 * bucket `thisValue` falls into, plus computes `thisValue`'s percentile
 * rank (share of the population at or below it).
 */
export function computeDistribution(
  values: number[],
  thisValue: number,
  bucketCount = 9
): Distribution {
  const clean = values.filter(v => Number.isFinite(v));

  if (clean.length === 0) {
    return { percentile: 0, buckets: [], thisMpBucketIndex: -1 };
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const width = max - min || 1; // avoid divide-by-zero when all values are equal
  const bucketWidth = width / bucketCount;

  const bucketOf = (v: number) =>
    Math.min(bucketCount - 1, Math.max(0, Math.floor((v - min) / bucketWidth)));

  const counts = new Array(bucketCount).fill(0);
  clean.forEach(v => {
    counts[bucketOf(v)]++;
  });

  const thisMpBucketIndex = bucketOf(thisValue);

  const buckets: DistributionBucket[] = counts.map((count, i) => ({
    rangeStart: Number((min + i * bucketWidth).toFixed(1)),
    rangeEnd: Number((min + (i + 1) * bucketWidth).toFixed(1)),
    count,
    isThisMpBucket: i === thisMpBucketIndex,
  }));

  const atOrBelow = clean.filter(v => v <= thisValue).length;
  const percentile = Math.round((atOrBelow / clean.length) * 100);

  return { percentile, buckets, thisMpBucketIndex };
}

/** Small helper for "above/below X avg" style labels. */
export function compareLabel(value: number, benchmark: number): 'above' | 'below' | 'equal' {
  if (value > benchmark) return 'above';
  if (value < benchmark) return 'below';
  return 'equal';
}
