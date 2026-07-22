"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bath,
  Bed,
  Building2,
  Car,
  CheckCircle2,
  FileUp,
  MapPin,
  Ruler,
} from "lucide-react";

import Container from "@/components/Container";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
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

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Price on request";
  }

  return amount.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "-";
  }

  return amount % 1 === 0 ? amount.toLocaleString("en-CA") : amount.toString();
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
      const response = await fetchPreconProperties({
        page: targetPage,
        pageSize: PAGE_SIZE,
      });

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(page);
  }, [page, loadPage]);

  const properties = data?.results ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

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

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <title>PreCon Listings | Estate-4u</title>
      <meta
        name="description"
        content="Browse pre-construction properties with paginated results."
      />

      <Header />

      <main className="flex-1 pb-16 pt-32">
        <Container>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-600">
                <Building2 className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Pre-Construction
                </span>
              </div>

              <h1 className="font-inter text-4xl font-extrabold text-ds-heading">
                PreCon Listings
              </h1>

              <p className="text-lg text-ds-body">
                Explore upcoming pre-construction properties across the GTA.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold leading-none text-ds-heading">
                  {isLoading ? "..." : (data?.count ?? 0)}
                </span>
                <span className="text-xs font-medium uppercase tracking-tight text-ds-body">
                  Properties
                </span>
              </div>
            </div>
          </div>

          <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <FileUp className="h-5 w-5" aria-hidden="true" />
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
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Choose file"}
                </Button>
              </div>
            </div>

            {uploadResult && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />

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
                        {uploadResult.errors
                          .slice(0, 10)
                          .map((rowError, index) => (
                            <li key={`${rowError.row}-${index}`}>
                              Row {rowError.row} (wp_id {rowError.wp_id || "-"}
                              ): {rowError.error}
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <p>{uploadError}</p>
              </div>
            )}
          </section>

          {error ? (
            <div className="rounded-2xl border border-dashed bg-white py-16 text-center">
              <h2 className="mb-2 text-xl font-bold text-ds-heading">
                Could not load listings
              </h2>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button type="button" onClick={() => void loadPage(page)}>
                Retry
              </Button>
            </div>
          ) : isLoading && !data ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-2xl border bg-white"
                />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white py-24 text-center">
              <Building2
                className="mx-auto mb-3 h-12 w-12 text-gray-300"
                aria-hidden="true"
              />
              <h2 className="mb-2 text-xl font-bold text-ds-heading">
                No pre-construction listings yet
              </h2>
              <p className="text-sm text-gray-500">
                Use the bulk upload above to import your first CSV.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => {
                  const imageUrl = property.featured_image_url;

                  return (
                    <Link
                      key={property.id}
                      href={`/precon-listings/${property.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={
                              property.title ||
                              `Pre-construction property ${property.wp_id}`
                            }
                            fill
                            unoptimized
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
                            {property.title || `Property #${property.wp_id}`}
                          </h2>

                          {property.address && (
                            <p className="mt-2 flex min-h-5 items-start gap-1.5 text-sm text-gray-500">
                              <MapPin
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="line-clamp-1">
                                {property.address}
                              </span>
                            </p>
                          )}
                        </div>

                        <p className="mt-4 text-xl font-extrabold text-purple-700">
                          {formatPrice(property.price)}
                        </p>

                        <dl className="mt-auto grid grid-cols-4 gap-2 border-t border-gray-100 pt-4 text-gray-600">
                          <div className="flex flex-col items-center gap-1">
                            <Bed
                              className="h-4 w-4 text-gray-400"
                              aria-hidden="true"
                            />
                            <dt className="sr-only">Bedrooms</dt>
                            <dd className="text-xs font-semibold">
                              {formatNumber(property.bedrooms)}
                            </dd>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <Bath
                              className="h-4 w-4 text-gray-400"
                              aria-hidden="true"
                            />
                            <dt className="sr-only">Bathrooms</dt>
                            <dd className="text-xs font-semibold">
                              {formatNumber(property.bathrooms)}
                            </dd>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <Car
                              className="h-4 w-4 text-gray-400"
                              aria-hidden="true"
                            />
                            <dt className="sr-only">Garages</dt>
                            <dd className="text-xs font-semibold">
                              {formatNumber(property.garages)}
                            </dd>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <Ruler
                              className="h-4 w-4 text-gray-400"
                              aria-hidden="true"
                            />
                            <dt className="sr-only">Area</dt>
                            <dd className="text-xs font-semibold">
                              {formatNumber(property.area)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!data?.previous || isLoading}
                    onClick={() =>
                      setPage((currentPage) => Math.max(1, currentPage - 1))
                    }
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!data?.next || isLoading}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
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
