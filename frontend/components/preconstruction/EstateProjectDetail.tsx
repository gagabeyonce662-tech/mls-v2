import Image from "next/image";
import { Building2, CalendarDays, MapPin, ShieldCheck } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { EstateProject } from "@/lib/api/estate";
import {
  getEstateProjectFacts,
  getEstateProjectLocation,
} from "@/lib/api/estate";

import EstateStructuredContent from "./EstateStructuredContent";
import EstateProjectFloorPlanButton from "./EstateProjectFloorPlanButton";

interface EstateProjectDetailProps {
  project: EstateProject;
}

export default function EstateProjectDetail({
  project,
}: EstateProjectDetailProps) {
  const sections = project.sections.filter(
    (section) => section.heading.trim() || section.html.trim(),
  );

  const facts = getEstateProjectFacts(project);

  const lowestPrice = project.prices
    .filter((price) => price.amount)
    .sort((a, b) => Number(a.amount) - Number(b.amount))[0];

  const priceLabel = lowestPrice?.display_text?.trim() || "Contact for pricing";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pb-20 pt-12">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
              Pre-Construction
            </p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
                  {project.title}
                </h1>

                <p className="mt-4 flex items-start gap-2 text-base text-slate-600 sm:text-lg">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-orange-600"
                    aria-hidden="true"
                  />
                  <span>{getEstateProjectLocation(project)}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Starting price
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-950">
                  {priceLabel}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Pricing and availability may change.
                </p>
              </div>
            </div>
            {facts.length > 0 && (
              <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                        {fact.label === "Developer" ? (
                          <Building2 className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <CalendarDays
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {fact.label}
                        </dt>
                        <dd className="mt-1 font-bold text-slate-950">
                          {fact.value}
                        </dd>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </dt>
                      <dd className="mt-1 font-bold capitalize text-slate-950">
                        {project.publication_status}
                      </dd>
                    </div>
                  </div>
                </div>
              </dl>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0">
              {project.featured_image_url && (
                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-200 shadow-xl">
                  <Image
                    src={project.featured_image_url}
                    alt={`${project.title} pre-construction project`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}

              {sections.length > 0 && (
                <div className="mt-10 space-y-8">
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    >
                      {section.heading.trim() && (
                        <h2 className="text-2xl font-extrabold text-slate-950">
                          {section.heading}
                        </h2>
                      )}

                      {section.html.trim() && (
                        <div
                          className="prose prose-slate mt-5 max-w-none leading-7"
                          dangerouslySetInnerHTML={{
                            __html: section.html,
                          }}
                        />
                      )}
                    </section>
                  ))}
                </div>
              )}

              <div className="mt-10">
                <EstateStructuredContent project={project} />
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                  Interested in this project?
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  Get pricing and floor plans
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Speak with the sales team for current availability,
                  incentives, deposit structures, and release information.
                </p>

                <div className="mt-6 space-y-3">
                  <EstateProjectFloorPlanButton />

                  <a
                    href="/contact"
                    className="flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-50"
                  >
                    Contact an agent
                  </a>
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Project details are for marketing purposes and should be
                  independently verified.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
