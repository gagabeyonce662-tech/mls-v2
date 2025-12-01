import { Card, CardContent } from "@/components/ui/card";
import { Home, DollarSign, TrendingUp, Users } from "lucide-react";
import { colors } from "@/config/design-system";

export default function StatsGrid() {
  const stats = [
    { label: "Active Listings", value: "12,456", change: "+12%", icon: Home, color: colors.primary, bgColor: colors.cards },
    { label: "Avg. Price", value: "$1.2M", change: "+5.3%", icon: DollarSign, color: colors.icon, bgColor: colors.cards },
    { label: "Sales This Month", value: "3,842", change: "+8.1%", icon: TrendingUp, color: colors.primary, bgColor: colors.cards },
    { label: "Active Users", value: "45K+", change: "+15%", icon: Users, color: colors.heading, bgColor: colors.cards },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-green-600">{stat.change}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
