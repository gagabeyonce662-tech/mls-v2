import { CalendarDays, Clock3, Video } from "lucide-react";

import PropertyCard from "@/components/PropertyCard";
import type { OpenHouseListing } from "@/lib/api/properties";

function formatDate(value: string | null): string {
  if (!value) return "Date to be confirmed";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(value: string | null): string {
  if (!value) return "";

  const parts = value.split(":");

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const date = new Date(2000, 0, 1, hours, minutes);

  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface OpenHouseCardProps {
  listing: OpenHouseListing;
  index?: number;
}

export default function OpenHouseCard({
  listing,
  index = 0,
}: OpenHouseCardProps) {
  const { open_house: openHouse, property } = listing;

  const startTime = formatTime(openHouse.start_time);

  const endTime = formatTime(openHouse.end_time);

  const timeLabel =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime || endTime || "Time to be confirmed";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-blue-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarDays
                className="h-4 w-4 text-blue-700"
                aria-hidden="true"
              />

              <span>{formatDate(openHouse.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Clock3 className="h-4 w-4" aria-hidden="true" />

              <span>{timeLabel}</span>
            </div>
          </div>

          <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">
            Open House
          </span>
        </div>

        {openHouse.remarks && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {openHouse.remarks}
          </p>
        )}

        {openHouse.livestream_url && (
          <a
            href={openHouse.livestream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            Live stream
          </a>
        )}
      </div>

      <PropertyCard property={property} index={index} layoutMode="compact" />
    </article>
  );
}
