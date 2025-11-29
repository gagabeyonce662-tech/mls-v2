"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart";
import {
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface PriceTrendData {
  month: string;
  communityAverage: number;
  listingPrice: number;
}

interface SalesDistributionData {
  type: string;
  sales: number;
}

interface PriceDistributionData {
  range: string;
  count: number;
}

interface CommunityStatisticsProps {
  priceTrends: PriceTrendData[];
  salesDistribution: SalesDistributionData[];
  priceDistribution: PriceDistributionData[];
}

const chartConfig = {
  communityAverage: {
    label: "Community Average Price",
    color: "hsl(173, 80%, 40%)",
  },
  listingPrice: {
    label: "Listing Price",
    color: "hsl(173, 60%, 50%)",
  },
};

export function CommunityStatistics({
  priceTrends,
  salesDistribution,
  priceDistribution,
}: CommunityStatisticsProps) {
  return (
    <div className="space-y-6">
      {/* Price Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="communityAverage"
                  stroke="hsl(173, 80%, 40%)"
                  fill="hsl(173, 80%, 40%)"
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="listingPrice"
                  stroke="hsl(173, 60%, 50%)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sales Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Distribution by Property Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="hsl(173, 80%, 40%)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Price Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Price Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(173, 80%, 40%)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

