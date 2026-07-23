"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { getMyListingSubmissions, ListingSubmission, withdrawListingSubmission } from "@/lib/api";
import { useUserAuth } from "@/contexts/UserAuthContext";

const statusColor: Record<string, string> = { draft: "bg-gray-100 text-gray-700", submitted: "bg-blue-100 text-blue-800", under_review: "bg-amber-100 text-amber-800", needs_changes: "bg-orange-100 text-orange-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-gray-200 text-gray-600" };

export default function DashboardListingsPage() {
  const { user, isLoading: authLoading } = useUserAuth();
  const params = useSearchParams();
  const [items, setItems] = useState<ListingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) {
      if (!authLoading) queueMicrotask(() => setLoading(false));
      return;
    }
    getMyListingSubmissions().then(setItems).catch(() => setError("Unable to load your submissions.")).finally(() => setLoading(false));
  }, [user, authLoading]);
  const withdraw = async (item: ListingSubmission) => { if (!window.confirm("Withdraw this submission?")) return; try { const updated = await withdrawListingSubmission(item.id); setItems((all) => all.map((row) => row.id === item.id ? updated : row)); } catch { setError("Unable to withdraw this submission."); } };
  return <div className="min-h-screen bg-gray-50"><Header /><main className="pt-32 pb-20"><Container><div className="mx-auto max-w-4xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-ds-heading">My listing submissions</h1><p className="mt-2 text-ds-body">Track drafts and reviewer feedback for your non-MLS listing requests.</p></div><Button asChild><Link href="/list-your-property">List a property</Link></Button></div>{params.get("submitted") && <p role="status" className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">Your listing has been submitted for review. We’ll contact you if anything else is needed.</p>}{!user && !authLoading ? <div className="rounded-2xl border bg-white p-8"><p>Sign in to view your submissions.</p><Button asChild className="mt-4"><Link href="/sign-in?next=/dashboard/listings">Sign in</Link></Button></div> : loading ? <p>Loading your submissions…</p> : error ? <p className="text-red-700">{error}</p> : items.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><p className="font-semibold">You have not submitted a property yet.</p><Button asChild className="mt-4"><Link href="/list-your-property">Start a submission</Link></Button></div> : <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-ds-heading">{item.address_line_1}{item.address_line_2 ? `, ${item.address_line_2}` : ""}</h2><p className="text-sm text-gray-600">{item.city}, {item.province} · {item.purpose_label} · ${Number(item.asking_price || 0).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[item.status]}`}>{item.status_label}</span></div>{item.review_note && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Reviewer note:</strong> {item.review_note}</div>}<div className="mt-4 flex items-center justify-between text-xs text-gray-500"><span>Last updated {new Date(item.updated_at).toLocaleDateString()}</span>{!["withdrawn", "rejected"].includes(item.status) && <button className="text-red-700 underline" onClick={() => withdraw(item)}>Withdraw</button>}</div></article>)}</div>}</div></Container></main><Footer /></div>;
}
