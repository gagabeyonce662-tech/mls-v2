import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";

import OpenHouseCard from "@/components/open-houses/OpenHouseCard";

import { fetchOpenHouses } from "@/lib/api/properties";

export const revalidate = 300;

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Open Houses in Ontario | Estate-4u",
  description:
    "Browse upcoming open houses for homes currently listed across Ontario.",
};

interface OpenHousesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value || "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function OpenHousesPage({
  searchParams,
}: OpenHousesPageProps) {
  const params = await searchParams;

  const requestedPage = parsePage(params.page);

  const response = await fetchOpenHouses();

  const totalPages = Math.max(
    1,
    Math.ceil(response.results.length / PAGE_SIZE),
  );

  const currentPage = Math.min(requestedPage, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visibleListings = response.results.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex-1 pb-16 pt-28 sm:pt-32">
        <Container>
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-blue-700">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />

                  <span className="text-sm font-bold uppercase tracking-[0.12em]">
                    Upcoming viewings
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Open Houses
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Explore upcoming open houses for properties currently
                  available in our Ontario listings.
                </p>
              </div>

              <div className="w-fit rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <div className="text-2xl font-extrabold text-slate-950">
                  {response.count.toLocaleString()}
                </div>

                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Open house events
                </div>
              </div>
            </div>
          </section>

          {visibleListings.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <CalendarDays
                className="mx-auto h-10 w-10 text-slate-400"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-xl font-bold text-slate-950">
                No upcoming open houses
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                There are currently no upcoming open houses in the cached
                Ontario listings. Check back again soon.
              </p>

              <Link
                href="/listing"
                className="mt-6 inline-flex rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
              >
                Browse all listings
              </Link>
            </section>
          ) : (
            <>
              <section
                aria-label="Open House listings"
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                {visibleListings.map((listing, index) => (
                  <OpenHouseCard
                    key={
                      listing.open_house.open_house_key ||
                      `${listing.property.listing_key}-${listing.open_house.date}-${listing.open_house.start_time}`
                    }
                    listing={listing}
                    index={startIndex + index}
                  />
                ))}
              </section>

              {totalPages > 1 && (
                <nav
                  aria-label="Open House pagination"
                  className="mt-10 flex items-center justify-center gap-3"
                >
                  {currentPage > 1 ? (
                    <Link
                      href={`/open-houses?page=${currentPage - 1}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                    Page{" "}
                    <strong className="text-slate-950">{currentPage}</strong> of{" "}
                    <strong className="text-slate-950">{totalPages}</strong>
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={`/open-houses?page=${currentPage + 1}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
