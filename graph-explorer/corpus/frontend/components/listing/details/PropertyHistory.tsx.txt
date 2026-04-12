import React from "react";
import { ds } from "@/lib/design-system-utils";

interface PropertyHistoryProps {
  history: {
    date: string;
    event: string;
    price: string;
    source: string;
  }[];
}

export default function PropertyHistory({ history }: PropertyHistoryProps) {
  return (
    <div className="space-y-4">
      <h2 className={`${ds.h3} mb-4`}>Property History</h2>
      <div className="border border-ds-card-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ds-card border-b border-ds-card-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-ds-heading">
                  Date
                </th>
                <th className="text-left p-4 text-sm font-semibold text-ds-heading">
                  Event & Source
                </th>
                <th className="text-right p-4 text-sm font-semibold text-ds-heading">
                  Price
                </th>
                <th className="text-right p-4 text-sm font-semibold text-ds-heading">
                  Appreciation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-card-border">
              {history.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-ds-card/50 transition-colors"
                >
                  <td className="p-4 text-sm text-ds-body">{item.date}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-ds-heading">
                      {item.event}
                    </div>
                    <div className="text-xs text-ds-body mt-0.5">
                      {item.source}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-ds-heading text-right">
                    {item.price}
                  </td>
                  <td className="p-4 text-sm text-ds-body text-right">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
