import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { neighborhoods } from "@/data/neighborhoods";

/** A responsive city discovery grid that links into the existing filtered search. */
export default function LocationsSection() {
  return (
    <section className="bg-white py-10 sm:py-14" aria-labelledby="neighborhoods-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          <div className="flex min-h-56 flex-col justify-center bg-stone-50 p-6 sm:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ds-primary">
              Explore our
            </p>
            <h2
              id="neighborhoods-heading"
              className="max-w-xs text-2xl font-semibold leading-tight text-ds-heading sm:text-3xl"
            >
              Neighbourhoods
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-ds-body">
              Discover a community where convenience meets charm. Our
              neighbourhoods are thoughtfully designed to offer everything you
              need within easy reach.
            </p>
          </div>

          {neighborhoods.map((neighborhood) => (
            <Link
              key={neighborhood.name}
              href={`/search-results?city=${encodeURIComponent(neighborhood.name)}`}
              className="group relative min-h-56 overflow-hidden bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary focus-visible:ring-offset-2"
              aria-label={`View homes for sale in ${neighborhood.name}`}
            >
              <Image
                src={neighborhood.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/10 transition-colors group-hover:from-slate-950/90" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 text-white">
                <h3 className="text-sm font-medium">{neighborhood.name}</h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </div>
              <span className="absolute bottom-4 left-4 text-[11px] font-semibold uppercase tracking-wider text-white">
                More details
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
