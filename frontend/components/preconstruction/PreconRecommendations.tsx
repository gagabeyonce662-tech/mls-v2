"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

import {
  fetchPreconRecommendations,
  type PreconProperty,
} from "@/lib/api/precon";

function formatPrice(value: string | null): string {
  if (!value) return "Price on request";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
      })
    : "Price on request";
}

export default function PreconRecommendations({
  propertyId,
}: {
  propertyId: number;
}) {
  const [projects, setProjects] = useState<PreconProperty[]>([]);

  useEffect(() => {
    let isCurrent = true;
    fetchPreconRecommendations(propertyId)
      .then((items) => {
        if (isCurrent) setProjects(items);
      })
      .catch(() => {
        if (isCurrent) setProjects([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [propertyId]);

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-600">
            Keep exploring
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
            More pre-construction projects you may like
          </h2>
        </div>
        <Link
          href="/precon-listings"
          className="text-sm font-bold text-ds-primary hover:underline"
        >
          Explore all pre-construction projects
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/precon-listings/${project.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 line-clamp-2 min-h-12 font-bold leading-6 text-slate-950 group-hover:text-ds-primary">
                {project.title || `Pre-construction project #${project.id}`}
              </h3>
              {project.address ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{project.address}</span>
                </p>
              ) : null}
              <p className="mt-4 text-sm font-extrabold text-slate-950">
                {formatPrice(project.price)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-600">
          Explore the latest pre-construction opportunities across our catalogue.
        </div>
      )}
    </section>
  );
}
