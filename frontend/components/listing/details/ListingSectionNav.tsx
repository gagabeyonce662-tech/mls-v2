"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ListingSectionLink {
  id: string;
  label: string;
}

export default function ListingSectionNav({
  sections,
}: {
  sections: ListingSectionLink[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id || "");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: [0.05, 0.25, 0.5],
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  const navigateTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    setActiveId(id);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="sticky top-0 z-30 -mx-4 border-y border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-3 sm:shadow-sm lg:top-20">
      <div className="flex gap-1 overflow-x-auto py-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => navigateTo(section.id)}
            className={cn(
              "relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              activeId === section.id
                ? "bg-blue-50 text-ds-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
