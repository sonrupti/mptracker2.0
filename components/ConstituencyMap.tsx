"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { MP } from "@/lib/supabase";

let cachedConstituencyData: GeoJSONData | null = null;

interface GeoFeature {
  type: string;
  properties: {
    pc_name: string;
    st_name: string;
    pc_id: number;
    [key: string]: any;
  };
  geometry: any;
}

interface GeoJSONData {
  type: string;
  features: GeoFeature[];
}

interface MpWithTier extends MP {
  percentile: number;
}

function getTierColor(percentile: number): string {
  if (percentile >= 80) return "#2563eb";
  if (percentile >= 70) return "#60a5fa";
  if (percentile >= 60) return "#06b6d4";
  if (percentile >= 50) return "#2dd4bf";
  if (percentile >= 40) return "#eab308";
  if (percentile >= 30) return "#f59e0b";
  if (percentile >= 20) return "#fb923c";
  return "#ea580c";
}

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

// Some GeoJSON datasets still use pre-2011 state names
const REVERSE_STATE_ALIASES: Record<string, string> = {
  odisha: "orissa",
  puducherry: "pondicherry",
  uttarakhand: "uttaranchal",
};

function getMatchNames(stateName: string): string[] {
  const norm = normalize(stateName);
  const alias = REVERSE_STATE_ALIASES[norm];
  return alias ? [norm, alias] : [norm];
}

interface ConstituencyMapProps {
  stateName: string;
  mps: MpWithTier[];
  className?: string;
}

export default function ConstituencyMap({ stateName, mps, className = "" }: ConstituencyMapProps) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(cachedConstituencyData);
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (cachedConstituencyData) {
      setGeoData(cachedConstituencyData);
      return;
    }
    fetch("/india_constituencies.geojson")
      .then((res) => res.json())
      .then((data) => {
        cachedConstituencyData = data;
        setGeoData(data);
      })
      .catch((err) => console.error("Failed to load constituency GeoJSON:", err));
  }, []);

  const stateFeatures = useMemo(() => {
    if (!geoData) return [];
    const matchNames = getMatchNames(stateName);
    return geoData.features.filter(
      (f) => f.properties?.st_name && matchNames.includes(normalize(f.properties.st_name))
    );
  }, [geoData, stateName]);

  const projection = useMemo(() => {
    if (stateFeatures.length === 0) return null;
    return geoMercator().fitSize([700, 700], { type: "FeatureCollection", features: stateFeatures } as any);
  }, [stateFeatures]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath().projection(projection);
  }, [projection]);

  const mpByConstituency = useMemo(() => {
    const map = new Map<string, MpWithTier>();
    mps.forEach((mp) => map.set(normalize(mp.constituency), mp));
    return map;
  }, [mps]);

  if (!geoData) {
    return (
      <div className={`flex h-[500px] items-center justify-center rounded-2xl border border-border bg-card ${className}`}>
        Loading constituency map...
      </div>
    );
  }

  if (stateFeatures.length === 0) {
    return (
      <div className={`flex h-[300px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground ${className}`}>
        No constituency boundary data available for {stateName}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <svg viewBox="0 0 700 700" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {stateFeatures.map((feature, i) => {
          const svgPath = pathGenerator?.(feature as any);
          if (!svgPath) return null;

          const pcName = feature.properties.pc_name;
          const mp = mpByConstituency.get(normalize(pcName));
          const fill = mp ? getTierColor(mp.percentile) : "#3f3f46";
          const isHovered = hovered === pcName;

          return (
            <path
              key={`${feature.properties.pc_id}-${i}`}
              d={svgPath}
              fill={fill}
              stroke="#000000"
              strokeWidth={0.6}
              opacity={isHovered ? 1 : 0.85}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHovered(pcName)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => mp && router.push(`/mps/${mp.id}`)}
            />
          );
        })}
      </svg>

      {hovered && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300">
            <MapPin className="h-3.5 w-3.5" />
            {hovered}
            {mpByConstituency.get(normalize(hovered)) && (
              <span className="text-muted-foreground font-normal">
                — {mpByConstituency.get(normalize(hovered))?.name}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#2563eb" }} />Top 20%</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#2dd4bf" }} />Above Avg</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />Below Avg</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ea580c" }} />Bottom 20%</span>
      </div>
    </div>
  );
}