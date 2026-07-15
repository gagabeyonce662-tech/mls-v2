"use client";

import { useEffect, useMemo, useState } from "react";
import { HardHat, SlidersHorizontal } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import type { EstateProjectCardData } from "@/lib/api/estate";
import EstateProjectCard from "./EstateProjectCard";

interface PreConstructionPageClientProps {
  initialProjects?: EstateProjectCardData[];
}

const EMPTY_PROJECTS: EstateProjectCardData[] = [];

function getInitialLimit(width: number): number {
  if (width >= 1536) return 10;
  if (width >= 1024) return 8;
  if (width >= 768) return 6;
  if (width >= 640) return 4;
  return 4;
}

export default function PreConstructionPageClient({
  initialProjects,
}: PreConstructionPageClientProps) {
  const [showAll, setShowAll] = useState(false);
  const [initialLimit, setInitialLimit] = useState(4);
  const isLoading = initialProjects === undefined;
  const projects = initialProjects ?? EMPTY_PROJECTS;

  useEffect(() => {
    const updateInitialLimit = () => setInitialLimit(getInitialLimit(window.innerWidth));
    updateInitialLimit();
    window.addEventListener("resize", updateInitialLimit);
    return () => window.removeEventListener("resize", updateInitialLimit);
  }, []);

  const displayedProjects = useMemo(
    () => (showAll ? projects : projects.slice(0, initialLimit)),
    [initialLimit, projects, showAll],
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1 px-4 pb-16 pt-32 lg:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-ds-primary">
            <HardHat className="h-5 w-5 text-orange-500" aria-hidden="true" />
            <span className="text-sm font-bold uppercase tracking-wider text-orange-600">
              New Developments
            </span>
          </div>
          <h1 className="mt-2 font-inter text-4xl font-extrabold text-ds-heading">
            Pre-Construction Projects
          </h1>
          <p className="mt-2 text-lg text-ds-body">
            Explore the latest builder developments, townhomes, and condos before
            they are built.
          </p>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
            aria-label="Loading pre-construction projects"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : displayedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {displayedProjects.map((project) => (
              <EstateProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-32 text-center shadow-inner">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <SlidersHorizontal className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-ds-heading">
                No Pre-Construction Projects Found
              </h2>
              <p className="leading-relaxed text-ds-body">
                We couldn&apos;t find any pre-construction projects at this time.
              </p>
            </div>
          </div>
        )}

        {!showAll && projects.length > initialLimit && !isLoading && (
          <div className="mt-16 flex justify-center">
            <Button
              onClick={() => setShowAll(true)}
              className="rounded-full bg-ds-primary px-12 py-7 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              View All {projects.length} Projects
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
