"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

let cachedGeoData: GeoJSONData | null = null;

interface IndiaMapProps {
  selectedState?: string | null;
  onStateClick?: (state: string) => void;
  className?: string;
  hideControls?: boolean;
}


  interface GeoFeature {
  type: string;
  properties: {
    NAME_1: string;
    ID_1: number;
    [key: string]: any;
  };
  geometry: any;
}

interface GeoJSONData {
  type: string;
  features: GeoFeature[];
}

export default function IndiaMap({
  selectedState,
  onStateClick,
  className = "",
  hideControls = false,
}: IndiaMapProps) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(cachedGeoData);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (cachedGeoData) {
      setGeoData(cachedGeoData);
      return;
    }

    fetch("/india_state.geojson")
      .then((res) => res.json())
      .then((data) => {
        cachedGeoData = data;
        setGeoData(data);
      })
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

 // Automatically fit the GeoJSON inside the SVG
const projection = useMemo(() => {
  if (!geoData) return null;

  return geoMercator()
    .fitSize([800, 900], geoData as any);

}, [geoData]);

const pathGenerator = useMemo(() => {
  if (!projection) return null;
  return geoPath().projection(projection);
}, [projection]);

if (!geoData || !pathGenerator) {
  return (
    <div
      className={`flex h-[650px] items-center justify-center rounded-xl border bg-card ${className}`}
    >
      Loading map...
    </div>
  );
}

const stateNames = geoData.features
  .map((f) => f.properties?.NAME_1)
  .filter((n): n is string => !!n)
  .sort((a, b) => a.localeCompare(b));

const handleSelectChange = (stateName: string) => {
  if (!stateName) return;
  onStateClick?.(stateName);
  const slug = stateName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  
};

return (
  <div
    className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}
  >
    {!hideControls && (
      <div className="mb-4 relative">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
          Or search your state
        </label>
        <select
          value=""
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 cursor-pointer"
        >
          <option value="">Select a state...</option>
          {stateNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    )}

    <svg
      viewBox="0 0 800 900"
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="800" height="900" fill="transparent" />

      {geoData.features
        .filter(
          (feature) =>
            feature.properties?.NAME_1 &&
            feature.properties?.ID_1 &&
            feature.geometry
        )
        .map((feature, index) => {
          const stateName = feature.properties.NAME_1;

          const svgPath = pathGenerator(feature as any);
          if (!svgPath) return null;

          const active = selectedState === stateName;
          const hovered = hoveredState === stateName;

          let fill = "#374151";

          if (hovered) fill = "#60a5fa";
          if (active) fill = "#4f46e5";

          return (
            <path
              key={`${feature.properties.ID_1}-${index}`}
              d={svgPath}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={0.8}
              className="cursor-pointer transition-all duration-200 hover:opacity-90"
              onMouseEnter={() => setHoveredState(stateName)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => {
  onStateClick?.(stateName);
}}
            />
          );
        })}
    </svg>

    {!hideControls && hoveredState && (
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          <MapPin className="h-3.5 w-3.5" />
          {hoveredState}
        </div>
      </div>
    )}
    {!hideControls && selectedState && (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Selected State
          </p>

          <h3 className="mt-1 text-xl font-bold">{selectedState}</h3>
        </div>

        <button
          onClick={() => onStateClick?.("")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Clear
        </button>
      </div>
    )}

    {!hideControls && (
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-500" />
          <span>State</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-400" />
          <span>Hover</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-indigo-600" />
          <span>Selected</span>
        </div>
      </div>
    )}
  </div>
);
}
