"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";
import { CompareModal } from "@/components/listing/CompareModal";
import { MapToggleButton } from "@/components/listing/MapToggleButton";
import { useInfiniteFilteredProperties } from "@/hooks/react-query";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { colors } from "@/config/design-system";
import { formatPrice } from "@/lib/propertyUtils";
import type { ListingLandingConfig } from "@/lib/seo/listingLandingConfig";

type Props = {
  landing: ListingLandingConfig;
};

export default function ListingLandingTemplate({ landing }: Props) {
  const interactions = usePropertyInteractions();
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const { viewMode, toggleViewMode } = useSearch();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteFilteredProperties({
    ...landing.filters,
    limit: 12,
  });

  const allProperties = data?.pages.flatMap((page) => page.results) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="root-content-offset pb-16 pt-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <section className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 md:p-8">
            {landing.heroEyebrow ? (
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
                {landing.heroEyebrow}
              </p>
            ) : null}
            <h1
              className="mb-3 text-3xl font-bold"
              style={{ color: colors.heading }}
            >
              {landing.h1}
            </h1>
            <p className="max-w-4xl text-base leading-relaxed text-gray-700">
              {landing.intro}
            </p>
            {landing.heroBody ? (
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-600">
                {landing.heroBody}
              </p>
            ) : null}
          </section>

          <section className="mb-4">
            isLoading ? "Loading..." : `${allProperties.length} properties found
            {landing.provisionalLogic ? (
              <p className="mt-2 text-sm text-amber-700">
                This category currently uses keyword-based matching. We will
                upgrade to strict MLS field filters when dedicated source flags
                are available.
              </p>
            ) : null}
          </section>

          {isError ? (
            <div className="text-center py-16">
              <div
                className="text-xl font-semibold mb-2"
                style={{ color: colors.heading }}
              >
                Error loading properties
              </div>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                Retry
              </button>
            </div>
          ) : (
            <PropertyGridLayout
              properties={allProperties}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoggedIn={isLoggedIn}
              interactions={interactions}
              currentCity={landing.filters.city || ""}
            />
          )}

          {landing.faqs && landing.faqs.length > 0 ? (
            <section className="mt-10 rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2
                className="mb-4 text-2xl font-semibold"
                style={{ color: colors.heading }}
              >
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {landing.faqs.map((faq) => (
                  <article key={faq.question}>
                    <h3 className="font-semibold text-gray-900">
                      {faq.question}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {faq.answer}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <CompareModal
        show={interactions.showCompareModal}
        selectedProperty={interactions.selectedProperty}
        onClose={interactions.closeCompareModal}
        onViewDetails={interactions.handleViewFromModal}
        onAddToCompare={() => {
          if (interactions.selectedProperty) {
            interactions.handleToggleCompare(interactions.selectedProperty);
          }
          interactions.closeCompareModal();
        }}
        formatPrice={formatPrice}
      />

      <PropertyQuickViewModal
        show={interactions.showQuickView}
        property={interactions.selectedProperty}
        onClose={interactions.closeQuickView}
      />

      <Footer />
      <MapToggleButton viewMode={viewMode} onToggle={toggleViewMode} />
    </div>
  );
}
