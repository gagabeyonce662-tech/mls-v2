"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteEstateProperty,
  fetchEstateProperties,
  type EstatePropertyRecord,
} from "@/lib/api/admin";
import { useToast } from "@/hooks/use-toast";

export default function EstatePropertiesPage() {
  const [rows, setRows] = useState<EstatePropertyRecord[]>([]);
  const [search, setSearch] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEstateProperties({
        search,
        publish_status: publishStatus || undefined,
        page_size: 30,
      });
      setRows(data.results || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load estate properties.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [publishStatus, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id: number) => {
    if (!confirm("Delete this estate property?")) return;
    try {
      await deleteEstateProperty(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast({
        title: "Error",
        description: "Delete failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Estate Properties</h1>
          <p className="text-sm text-gray-500">Houzez-style inventory management.</p>
        </div>
        <Link
          href="/admin/estate-properties/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
        >
          Add Estate Property
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-3 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, slug, listing key, address, city"
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={publishStatus}
          onChange={(e) => setPublishStatus(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="private">Private</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={load}
          className="px-3 py-2 rounded-lg border text-sm font-medium"
        >
          Apply
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Listing Key</th>
                <th className="text-left px-4 py-2">Address</th>
                <th className="text-left px-4 py-2">City</th>
                <th className="text-left px-4 py-2">Publish</th>
                <th className="text-left px-4 py-2">Price</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.property_title ?? "-"}</td>
                  <td className="px-4 py-2">{r.listing_key ?? "-"}</td>
                  <td className="px-4 py-2">{r.unparsed_address ?? "-"}</td>
                  <td className="px-4 py-2">{r.city ?? "-"}</td>
                  <td className="px-4 py-2">{r.publish_status ?? "-"}</td>
                  <td className="px-4 py-2">{r.list_price ?? "-"}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link
                      href={`/admin/estate-properties/${r.id}`}
                      className="text-blue-600 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
