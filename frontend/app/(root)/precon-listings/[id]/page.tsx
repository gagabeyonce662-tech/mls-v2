"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  ExternalLink,
  MapPin,
  Ruler,
  Tag,
  User,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import {
  fetchPreconProperty,
  type PreconPropertyDetail,
} from "@/lib/api/precon";

function formatPrice(value: string | null): string {
  if (!value) return "Price on request";
  const num = Number(value);
  if (Number.isNaN(num)) return "Price on request";
  return num.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num % 1 === 0 ? num.toLocaleString() : num.toString();
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export default function PreconDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<PreconPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await fetchPreconProperty(id);
      setData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const featuredImage = data?.attachments.find((a) =>
    a.mime_type?.startsWith("image/"),
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>
        {data?.title ? `${data.title} | PreCon | Estate-4u` : "PreCon Listing"}
      </title>

      <Header />

      <main className="flex-1 pt-32 pb-16">
        <Container>
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/precon-listings")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to listings
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="h-72 rounded-2xl bg-white border animate-pulse" />
              <div className="h-48 rounded-2xl bg-white border animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
              <h3 className="text-xl font-bold text-ds-heading mb-2">
                Could not load this listing
              </h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <div className="flex justify-center gap-3">
                <Button onClick={load}>Retry</Button>
                <Link href="/precon-listings">
                  <Button variant="outline">Back to listings</Button>
                </Link>
              </div>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    {featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredImage.url}
                        alt={featuredImage.title || data.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-20 h-20 text-purple-400" />
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Pre-Construction
                      </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-ds-heading">
                      {data.title || `Property #${data.wp_id}`}
                    </h1>
                    {data.address && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {data.address}
                      </p>
                    )}
                    <div className="text-4xl font-extrabold text-purple-700">
                      {formatPrice(data.price)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <SpecItem
                        icon={<Bed className="w-4 h-4" />}
                        label="Bedrooms"
                        value={formatNumber(data.bedrooms)}
                      />
                      <SpecItem
                        icon={<Bath className="w-4 h-4" />}
                        label="Bathrooms"
                        value={formatNumber(data.bathrooms)}
                      />
                      <SpecItem
                        icon={<Car className="w-4 h-4" />}
                        label="Garages"
                        value={formatNumber(data.garages)}
                      />
                      <SpecItem
                        icon={<Ruler className="w-4 h-4" />}
                        label="Area"
                        value={formatNumber(data.area)}
                      />
                    </div>
                  </div>
                </div>

                {(data.excerpt || data.body) && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-3">
                    <h2 className="text-xl font-bold text-ds-heading">
                      About this property
                    </h2>
                    {data.excerpt && (
                      <p className="text-gray-700 italic">{data.excerpt}</p>
                    )}
                    {data.body && (
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: data.body }}
                      />
                    )}
                  </div>
                )}

                {data.attachments.length > 0 && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-xl font-bold text-ds-heading mb-4">
                      Attachments
                    </h2>
                    <ul className="space-y-2">
                      {data.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {a.title || a.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <aside className="space-y-6">
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                  <h2 className="text-lg font-bold text-ds-heading mb-4">
                    Details
                  </h2>
                  <dl className="space-y-3 text-sm">
                    <DetailRow label="WP ID" value={String(data.wp_id)} />
                    <DetailRow label="Slug" value={data.slug || "-"} />
                    <DetailRow label="Status" value={data.status || "-"} />
                    <DetailRow
                      label="Content type"
                      value={data.content_type || "-"}
                    />
                    <DetailRow
                      label="Lot size"
                      value={formatNumber(data.lot_size)}
                    />
                    <DetailRow
                      label="Latitude"
                      value={formatNumber(data.latitude)}
                    />
                    <DetailRow
                      label="Longitude"
                      value={formatNumber(data.longitude)}
                    />
                  </dl>
                </div>

                {data.author && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-lg font-bold text-ds-heading mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Author
                    </h2>
                    <p className="text-sm font-semibold text-gray-800">
                      {data.author.display_name}
                    </p>
                    {data.author.email && (
                      <p className="text-sm text-gray-500">{data.author.email}</p>
                    )}
                  </div>
                )}

                {data.published_at && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-lg font-bold text-ds-heading mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Published
                    </h2>
                    <p className="text-sm text-gray-700">
                      {formatDate(data.published_at)}
                    </p>
                  </div>
                )}

                {data.taxonomies.length > 0 && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-lg font-bold text-ds-heading mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags & categories
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {data.taxonomies.map((t) => (
                        <span
                          key={t.id}
                          className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                          title={t.taxonomy}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(data.meta).length > 0 && (
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-lg font-bold text-ds-heading mb-3">
                      Meta
                    </h2>
                    <dl className="space-y-2 text-sm">
                      {Object.entries(data.meta).map(([k, v]) => (
                        <DetailRow key={k} label={k} value={v} />
                      ))}
                    </dl>
                  </div>
                )}
              </aside>
            </div>
          ) : null}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-ds-heading">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800 text-right break-all">{value}</dd>
    </div>
  );
}
