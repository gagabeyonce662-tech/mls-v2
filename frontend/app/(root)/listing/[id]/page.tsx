import ListingDetails from "@/components/homepage/ListingDetails";
import { LISTING_DETAILS } from "@/data/listingDetails";

export function generateStaticParams() {
  return Object.keys(LISTING_DETAILS).map((id) => ({ id }));
}

export default function ListingPage() {
  return <ListingDetails />;
}

