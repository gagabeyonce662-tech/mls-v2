"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";

interface CostData {
  name: string;
  value: number;
  color: string;
}

interface OwnershipCostAnalysisProps {
  totalCost: number;
  costs: CostData[];
}

const chartConfig = {
  mortgage: {
    label: "Mortgage Payment",
    color: "hsl(var(--chart-1))",
  },
  tax: {
    label: "Property Tax",
    color: "hsl(var(--chart-2))",
  },
  maintenance: {
    label: "Maintenance Fee",
    color: "hsl(var(--chart-3))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-4))",
  },
};

export function OwnershipCostAnalysis({
  totalCost,
  costs,
}: OwnershipCostAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership Cost Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costs}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">
                                  {payload[0].name}
                                </span>
                                <span className="text-sm font-bold">
                                  ${payload[0].value?.toLocaleString('en-US')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Cost Breakdown Table */}
          <div className="flex flex-col justify-center">
            <div className="text-3xl font-bold text-teal-600 mb-4">
              ${totalCost.toLocaleString('en-US')}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Total Cost per Month
            </div>
            <div className="space-y-3">
              {costs.map((cost, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cost.color }}
                    />
                    <span className="text-sm text-gray-700">{cost.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${cost.value.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
