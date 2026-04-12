"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  fetchAllExclusiveProperties,
  deleteProperty,
  type Property,
} from "@/lib/api";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  AlertTriangle,
  Home,
} from "lucide-react";
import { colors } from "@/config/design-system";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllExclusiveProperties();
      setProperties(data);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const filterProperties = useCallback(() => {
    let filtered = [...properties];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.unparsed_address || "").toLowerCase().includes(query) ||
          (p.City || "").toLowerCase().includes(query) ||
          (p.ListingKey || "").toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (p) => (p.standard_status || "Active") === statusFilter,
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, statusFilter]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, statusFilter, properties, filterProperties]);

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteProperty(propertyToDelete);
      if (success) {
        toast({
          title: "Success",
          description: "Property deleted successfully.",
        });
        // Remove from local state immediately
        setProperties((prev) =>
          prev.filter((p) => p.ListingKey !== propertyToDelete),
        );
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to delete property. It might not exist or you don't have permission.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500 text-sm">
            Manage your exclusive property inventory.
          </p>
        </div>
        <Link
          href="/admin/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus className="w-4 h-4" />
          Add New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address, city, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Sold">Sold</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No listings found
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Get started by creating your first listing."}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/listings/new"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Create Listing &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">
                    Property
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900">
                    Price
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900">
                    Modified
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProperties.map((property) => (
                  <tr
                    key={property.ListingKey}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                          {property.media?.[0]?.media_url ? (
                            <Image
                              src={property.media[0].media_url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Home className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {property.unparsed_address ||
                              property.address ||
                              "Untitled"}
                          </div>
                          <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {property.City}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {property.ListPrice
                        ? `$${property.ListPrice.toLocaleString('en-US')}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${property.standard_status === "Active"
                            ? "bg-green-100 text-green-700"
                            : property.standard_status === "Sold"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {property.standard_status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {property.ModificationTimestamp
                        ? format(
                          new Date(property.ModificationTimestamp),
                          "MMM d, yyyy",
                        )
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg transition-colors outline-none">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link
                            href={`/listing/${property.ListingKey}`}
                            target="_blank"
                          >
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              <Eye className="w-4 h-4" /> View Public
                            </DropdownMenuItem>
                          </Link>
                          {/* 
                          <Link href={`/admin/listings/${property.ListingKey}`}>
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              <Edit className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                          </Link>
                          */}
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() =>
                              setPropertyToDelete(
                                property.ListingKey
                                  ? String(property.ListingKey)
                                  : null,
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!propertyToDelete}
        onOpenChange={(open) => !open && setPropertyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
