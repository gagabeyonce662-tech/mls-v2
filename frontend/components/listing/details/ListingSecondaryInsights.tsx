import {
  fetchListingCatalogStats,
  fetchPropertySnapshots,
  fetchCensusFsaProfile,
} from "@/lib/api";

import ListingCatalogStatsSection from "./ListingCatalogStatsSection";
import ListingDemographicsSection from "./ListingDemographicsSection";
import PropertyHistory from "./PropertyHistory";

interface HistoryRow {
  date: string;
  event: string;
  price: string;
  source: string;
}

interface ListingSecondaryInsightsProps {
  listingKey: string;
  city?: string;
  fsa?: string;
  currentListPrice: number | null;
  currentHistoryRow: HistoryRow;
  catalogStatsTitle: string;
  demographicsTitle: string;
}

export default async function ListingSecondaryInsights({
  listingKey,
  city,
  fsa,
  currentListPrice,
  currentHistoryRow,
  catalogStatsTitle,
  demographicsTitle,
}: ListingSecondaryInsightsProps) {
  const [catalogStats, snapshots, census] = await Promise.all([
    fetchListingCatalogStats({
      city: city || undefined,
      fsa: fsa || undefined,
    }),
    fetchPropertySnapshots(listingKey),
    fsa ? fetchCensusFsaProfile(fsa) : Promise.resolve(null),
  ]);

  const snapshotHistoryRows: HistoryRow[] = [...snapshots]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((snapshot) => ({
      date: new Date(snapshot.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      event: snapshot.standard_status || "Catalog snapshot",
      price:
        snapshot.list_price != null
          ? `$${Number(snapshot.list_price).toLocaleString("en-US")}`
          : "—",
      source: "Our catalog sync history",
    }));

  const history =
    snapshotHistoryRows.length > 0
      ? [...snapshotHistoryRows, currentHistoryRow]
      : [currentHistoryRow];

  return (
    <>
      <ListingCatalogStatsSection
        stats={catalogStats}
        currentListPrice={currentListPrice}
        title={catalogStatsTitle}
      />

      <ListingDemographicsSection
        fsa={fsa || ""}
        profile={census?.profile ?? null}
        headingPrefix={demographicsTitle}
      />

      <PropertyHistory history={history} />
    </>
  );
}
