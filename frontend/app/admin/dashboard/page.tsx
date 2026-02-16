"use client";

import { useEffect, useState } from "react";
import { fetchAllExclusiveProperties, type Property } from "@/lib/api";
import {
  BarChart3,
  Home,
  DollarSign,
  Eye,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { colors } from "@/config/design-system";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalValue: 0,
    avgPrice: 0,
  });
  const [recentListings, setRecentListings] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const properties = await fetchAllExclusiveProperties();

        const active = properties.filter(
          (p) => !p.standard_status || p.standard_status === "Active",
        );
        const sold = properties.filter((p) => p.standard_status === "Sold");

        const totalValue = active.reduce(
          (acc, curr) => acc + (curr.ListPrice || 0),
          0,
        );
        const avgPrice = active.length > 0 ? totalValue / active.length : 0;

        setStats({
          totalListings: properties.length,
          activeListings: active.length,
          soldListings: sold.length,
          totalValue,
          avgPrice,
        });

        // Get 5 most recent
        setRecentListings(properties.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const statCards = [
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: Home,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Inventory Value",
      value: `$${(stats.totalValue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Sold Properties",
      value: stats.soldListings,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Recent Views",
      value: "1.2k", // Mock data for now
      icon: Eye,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 text-sm">
          Welcome back. Here's what's happening with your listings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +2.5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Listings</h2>
          <Link
            href="/admin/listings"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentListings.map((listing) => (
            <div
              key={listing.ListingKey}
              className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {listing.media?.[0]?.media_url ? (
                  <img
                    src={listing.media[0].media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Home className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {listing.unparsed_address ||
                    listing.address ||
                    "Untitled Property"}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>
                    {listing.City}, {listing.StateOrProvince}
                  </span>
                  <span>•</span>
                  <span>${listing.ListPrice?.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-900">
                  {listing.ModificationTimestamp
                    ? format(
                        new Date(listing.ModificationTimestamp),
                        "MMM d, yyyy",
                      )
                    : "Recently"}
                </div>
                <div
                  className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-medium ${
                    listing.standard_status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {listing.standard_status || "Active"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
