"use client";

import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Home,
  LogOut,
  Settings,
  PlusCircle,
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { colors } from "@/config/design-system";

// Inner component to use the auth hook
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAdminAuth();
  const pathname = usePathname();

  // If on login page, render full screen
  if (pathname === "/admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // If authenticated, render dashboard layout
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className="w-64 fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white"
          style={{ borderColor: colors.cardsBoarder }}
        >
          <div
            className="h-16 flex items-center px-6 border-b"
            style={{ borderColor: colors.cardsBoarder }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
              style={{ color: colors.primary }}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span>Admin Panel</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin/dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>

            <Link
              href="/admin/listings"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/admin/listings") &&
                pathname !== "/admin/listings/new"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Home className="w-5 h-5" />
              All Listings
            </Link>

            <Link
              href="/admin/listings/new"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin/listings/new"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              Add Listing
            </Link>
          </nav>

          <div
            className="p-4 border-t"
            style={{ borderColor: colors.cardsBoarder }}
          >
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto p-8">{children}</div>
        </main>
      </div>
    );
  }

  // Fallback (should be handled by context redirect, but just in case)
  return null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
      <Toaster />
    </AdminAuthProvider>
  );
}
