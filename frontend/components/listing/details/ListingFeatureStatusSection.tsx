"use client";

import { ds } from "@/lib/design-system-utils";

type Row = {
  feature: string;
  status: "Available" | "Partial" | "Planned";
  dependency: string;
};

export default function ListingFeatureStatusSection({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <section className="bg-white border border-ds-card-border rounded-2xl p-6 shadow-sm">
      <h2 className={`${ds.h3} mb-3`}>Feature readiness</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ds-body">
              <th className="py-2 pr-4">Feature</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Dependency</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t border-ds-card-border">
                <td className="py-2 pr-4 text-ds-heading">{row.feature}</td>
                <td className="py-2 pr-4">{row.status}</td>
                <td className="py-2 text-ds-body">{row.dependency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
