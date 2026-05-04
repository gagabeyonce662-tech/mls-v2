import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-ds-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-3/4 max-w-3xl" />
          <Skeleton className="h-8 w-52" />
        </div>

        <Skeleton className="w-full h-96 rounded-2xl mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={`stat-${idx}`} className="h-24 rounded-xl" />
              ))}
            </div>

            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>

          <aside>
            <Skeleton className="h-[520px] rounded-2xl" />
          </aside>
        </div>

        <Skeleton className="h-72 rounded-2xl mt-10" />
      </main>

      <Footer />
    </div>
  );
}
