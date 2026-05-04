import type { Property } from "@/lib/api";
import { getListingExternalMediaLinks } from "@/lib/propertyUtils";
import { ds } from "@/lib/design-system-utils";
import { ExternalLink } from "lucide-react";

export default function ListingExternalLinks({
  property,
}: {
  property: Property;
}) {
  const links = getListingExternalMediaLinks(property);
  if (links.length === 0) return null;

  return (
    <section className="mb-10 bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-4`}>Tours & external media</h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ds-primary font-medium hover:underline"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              <span>{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
