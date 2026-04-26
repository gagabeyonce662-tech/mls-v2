"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Info, MapPin } from "lucide-react";
import { School } from "@/lib/api";
import { ds } from "@/lib/design-system-utils";

interface NearestSchoolsSectionProps {
  schools: School[];
  radiusMeters: number;
  hasCoordinates: boolean;
  isUnavailable?: boolean;
}

const MAX_VISIBLE_BY_DEFAULT = 5;

function formatDistanceMeters(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return "N/A";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  const km = distanceMeters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

function formatRadiusMeters(radiusMeters: number): string {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return "N/A";
  }
  const km = radiusMeters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

export default function NearestSchoolsSection({
  schools,
  radiusMeters,
  hasCoordinates,
  isUnavailable = false,
}: NearestSchoolsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const sortedSchools = useMemo(
    () =>
      [...schools].sort((a, b) => {
        const aDistance = Number.isFinite(a.distance_meters)
          ? a.distance_meters
          : Number.MAX_SAFE_INTEGER;
        const bDistance = Number.isFinite(b.distance_meters)
          ? b.distance_meters
          : Number.MAX_SAFE_INTEGER;
        return aDistance - bDistance;
      }),
    [schools],
  );

  const visibleSchools = showAll
    ? sortedSchools
    : sortedSchools.slice(0, MAX_VISIBLE_BY_DEFAULT);

  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className={`${ds.h3} flex items-center gap-2`}>
            <GraduationCap className="h-5 w-5 text-ds-primary" />
            Nearest Schools
          </h2>
          <p className="text-sm text-ds-body mt-1">
            Nearby schools to help evaluate daily convenience and family fit.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-ds-card-border bg-ds-card/40 px-3 py-2 text-xs text-ds-body flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Radius: {formatRadiusMeters(radiusMeters)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Source: OpenStreetMap / Overpass
        </span>
      </div>

      {!hasCoordinates ? (
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-4 text-sm text-ds-body">
          School data unavailable for this listing.
        </div>
      ) : isUnavailable ? (
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-4 text-sm text-ds-body">
          We could not load nearby schools right now. Please try again shortly.
        </div>
      ) : sortedSchools.length === 0 ? (
        <div className="rounded-xl border border-ds-card-border bg-ds-card/40 p-4 text-sm text-ds-body">
          No nearby schools found in this radius.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visibleSchools.map((school) => (
              <article
                key={`${school.osm_id}-${school.name}`}
                className="rounded-xl border border-ds-card-border bg-ds-card/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ds-heading">
                      {school.name || "Unnamed School"}
                    </h3>
                    {school.address ? (
                      <p className="text-xs text-ds-body mt-1">{school.address}</p>
                    ) : null}
                    {school.operator ? (
                      <p className="text-xs text-ds-body mt-1">
                        Operator: {school.operator}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-xs font-semibold text-ds-primary shrink-0">
                    {formatDistanceMeters(school.distance_meters)}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {sortedSchools.length > MAX_VISIBLE_BY_DEFAULT && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-4 text-sm font-medium text-ds-primary hover:underline"
            >
              {showAll ? "Show fewer schools" : "View all nearby schools"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
