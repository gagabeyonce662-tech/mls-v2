"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableRow } from "./table";

interface IncomeDistribution {
  range: string;
  value: number;
  color: string;
}

interface DemographicsData {
  population: number;
  medianAge: number;
  averageHouseholdSize: number;
  averageHouseholdIncome: string;
  educationLevel: string;
  employmentRate: string;
  languageSpoken: string;
}

interface DemographicsSectionProps {
  incomeDistribution: IncomeDistribution[];
  demographics: DemographicsData;
}

const chartConfig = {
  income: {
    label: "Household Income",
  },
};

export function DemographicsSection({
  incomeDistribution,
  demographics,
}: DemographicsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Demographics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-gray-700 w-1/2">
                  Population
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.population.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Median Age
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.medianAge} years
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Average Household Size
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.averageHouseholdSize}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Average Household Income
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.averageHouseholdIncome}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Education Level
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.educationLevel}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Employment Rate
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.employmentRate}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Language Spoken
                </TableCell>
                <TableCell className="text-gray-900">
                  {demographics.languageSpoken}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Income Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Household Income Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percent }) =>
                    `${range}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeDistribution.map((entry, index) => (
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
                                {payload[0].payload.range}
                              </span>
                              <span className="text-sm font-bold">
                                {((payload[0].value as number) * 100).toFixed(
                                  1,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
