import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin, Star } from "lucide-react";
import type { EstateProjectCardData } from "@/lib/api/estate";
import {
  getEstateProjectLocation,
  getEstateProjectFacts,
  getEstateProjectPriceLabel,
  getEstateProjectUrl,
} from "@/lib/api/estate";

interface EstateProjectCardProps {
  project: EstateProjectCardData;
}

export default function EstateProjectCard({ project }: EstateProjectCardProps) {
  const projectUrl = getEstateProjectUrl(project);
  const facts = getEstateProjectFacts(project);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={projectUrl}
        className="relative block aspect-[4/3] overflow-hidden bg-gray-100"
        aria-label={`View ${project.title}`}
      >
        {project.featured_image_url ? (
          <Image
            src={project.featured_image_url}
            alt={`${project.title} pre-construction project`}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Building2 className="h-12 w-12" aria-hidden="true" />
            <span className="sr-only">Project image unavailable</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Pre-Construction
          </span>
          {project.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-bold leading-tight text-ds-heading">
          <Link href={projectUrl} className="hover:text-ds-primary">
            {project.title}
          </Link>
        </h2>

        <p className="mt-3 flex items-start gap-2 text-sm text-ds-body">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{getEstateProjectLocation(project)}</span>
        </p>

        {facts.length > 0 && (
          <dl className="mt-4 space-y-2 text-sm text-ds-body">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-2">
                {fact.label === "Developer" ? (
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <dt className="sr-only">{fact.label}</dt>
                <dd>{fact.label === "Occupancy" ? `Occupancy ${fact.value}` : fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto pt-5">
          <p className="text-lg font-bold text-ds-heading">
            {getEstateProjectPriceLabel(project)}
          </p>
          <Link
            href={projectUrl}
            className="mt-4 inline-flex items-center gap-2 font-semibold text-ds-primary hover:underline"
          >
            View project
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
