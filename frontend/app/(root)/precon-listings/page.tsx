"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Car,
  FileUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import {
  bulkUploadPreconProperties,
  fetchPreconProperties,
  type PreconBulkUploadResponse,
  type PreconPage,
} from "@/lib/api/precon";

const PAGE_SIZE = 12;

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

function getPropertyImageUrl(prop: {
  featured_image_url?: string | null;
  featured_image?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
}): string | null {
  return (
    prop.featured_image_url ||
    prop.featured_image ||
    prop.image_url ||
    prop.thumbnail_url ||
    null
  );
}

export default function PreconListingsPage() {
  const [data, setData] = useState<PreconPage | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] =
    useState<PreconBulkUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadPage = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const json = await fetchPreconProperties({
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);
    try {
      const result = await bulkUploadPreconProperties(file);
      setUploadResult(result);
      setPage(1);
      await loadPage(1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>PreCon Listings | Estate-4u</title>
      <meta
        name="description"
        content="Browse pre-construction properties with paginated results."
      />

      <Header />

      <main className="flex-1 pt-32 pb-16">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Pre-Construction
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-ds-heading font-inter">
                PreCon Listings
              </h1>
              <p className="text-ds-body text-lg">
                Explore upcoming pre-construction properties across the GTA.
              </p>
            </div>

            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-ds-heading font-bold text-xl leading-none">
                  {isLoading ? "..." : (data?.count ?? 0)}
                </span>
                <span className="text-ds-body text-xs font-medium uppercase tracking-tight">
                  Properties
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-ds-heading">Bulk Upload</p>
                  <p className="text-sm text-gray-500">
                    Upload a CSV or Excel file to create pre-construction
                    properties.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Choose file"}
                </Button>
              </div>
            </div>

            {uploadResult && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Created {uploadResult.created}, updated{" "}
                    {uploadResult.updated}
                    {uploadResult.skipped > 0
                      ? `, skipped ${uploadResult.skipped}`
                      : ""}
                    .
                  </p>
                  {uploadResult.errors.length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-green-900/70">
                        View {uploadResult.errors.length} row error(s)
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs">
                        {uploadResult.errors.slice(0, 10).map((e, i) => (
                          <li key={i}>
                            Row {e.row} (wp_id {e.wp_id || "-"}): {e.error}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{uploadError}</p>
              </div>
            )}
          </div>

          {error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
              <h3 className="text-xl font-bold text-ds-heading mb-2">
                Could not load listings
              </h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button onClick={() => loadPage(page)}>Retry</Button>
            </div>
          ) : isLoading && !data ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {data?.results.map((prop) => {
                const imageUrl = getPropertyImageUrl(prop);

                return (
                  <Link
                    key={prop.id}
                    href={`/precon-listings/${prop.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={
                            prop.title ||
                            `Pre-construction property ${prop.wp_id}`
                          }
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                          <Building2
                            className="h-12 w-12 text-purple-400"
                            aria-hidden="true"
                          />
                          <span className="sr-only">
                            Property image unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div>
                        <h2 className="min-h-12 line-clamp-2 text-lg font-bold leading-6 text-ds-heading">
                          {prop.title || `Property #${prop.wp_id}`}
                        </h2>

                        {prop.address && (
                          <p className="mt-2 flex min-h-5 items-start gap-1.5 text-sm text-gray-500">
                            <MapPin
                              className="mt-0.5 h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-1">{prop.address}</span>
                          </p>
                        )}
                      </div>

                      <p className="mt-4 text-xl font-extrabold text-purple-700">
                        {formatPrice(prop.price)}
                      </p>

                      <dl className="mt-auto grid grid-cols-4 gap-2 border-t border-gray-100 pt-4 text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <Bed
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Bedrooms</dt>
                          <dd className="text-xs font-semibold">
                            {formatNumber(prop.bedrooms)}
                          </dd>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <Bath
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Bathrooms</dt>
                          <dd className="text-xs font-semibold">
                            {formatNumber(prop.bathrooms)}
                          </dd>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <Car
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Garages</dt>
                          <dd className="text-xs font-semibold">
                            {formatNumber(prop.garages)}
                          </dd>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <Ruler
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Area</dt>
                          <dd className="text-xs font-semibold">
                            {formatNumber(prop.area)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (data?.results?.length ?? 0) === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-xl font-bold text-ds-heading mb-2">
                No pre-construction listings yet
              </h3>
              <p className="text-sm text-gray-500">
                Use the bulk upload above to import your first CSV.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.results.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/precon-listings/${prop.id}`}
                    className="block bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-purple-400" />
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <h2 className="font-bold text-lg text-ds-heading line-clamp-1">
                          {prop.title || `Property #${prop.wp_id}`}
                        </h2>
                        {prop.address && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {prop.address}
                          </p>
                        )}
                      </div>
                      <div className="text-2xl font-extrabold text-purple-700">
                        {formatPrice(prop.price)}
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-3 border-t text-xs text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                          <Bed className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">
                            {formatNumber(prop.bedrooms)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Bath className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">
                            {formatNumber(prop.bathrooms)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">
                            {formatNumber(prop.garages)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Ruler className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">
                            {formatNumber(prop.area)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!data?.previous || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!data?.next || isLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
