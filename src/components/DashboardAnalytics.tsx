import { useMemo } from "react";
import { Order } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, PieChartIcon, Calendar } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DashboardAnalyticsProps {
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  received: "#f59e0b",
  washing: "#3b82f6",
  ironing: "#8b5cf6",
  ready: "#22c55e",
  delivered: "#14b8a6",
};

const chartConfig = {
  orders: { label: "Orders", color: "hsl(var(--primary))" },
  received: { label: "Received", color: "#f59e0b" },
  washing: { label: "Washing", color: "#3b82f6" },
  ironing: { label: "Ironing", color: "#8b5cf6" },
  ready: { label: "Ready", color: "#22c55e" },
  delivered: { label: "Delivered", color: "#14b8a6" },
};

export function DashboardAnalytics({ orders }: DashboardAnalyticsProps) {
  // Status distribution data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      received: 0,
      washing: 0,
      ironing: 0,
      ready: 0,
      delivered: 0,
    };
    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      status,
    }));
  }, [orders]);

  // Daily orders for the last 7 days
  const dailyData = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 6);
    const interval = eachDayOfInterval({ start: sevenDaysAgo, end: today });

    return interval.map((date) => {
      const dayOrders = orders.filter((order) => {
        const orderDate = startOfDay(new Date(order.createdAt));
        return orderDate.getTime() === date.getTime();
      });
      return {
        date: format(date, "EEE"),
        fullDate: format(date, "MMM d"),
        orders: dayOrders.length,
        items: dayOrders.reduce((sum, o) => sum + o.items, 0),
      };
    });
  }, [orders]);

  // Items per status
  const itemsPerStatus = useMemo(() => {
    const items: Record<string, number> = {
      received: 0,
      washing: 0,
      ironing: 0,
      ready: 0,
      delivered: 0,
    };
    orders.forEach((order) => {
      if (items[order.status] !== undefined) {
        items[order.status] += order.items;
      }
    });
    return Object.entries(items).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      items: count,
      status,
    }));
  }, [orders]);

  const totalItems = orders.reduce((sum, o) => sum + o.items, 0);
  const avgItemsPerOrder = orders.length > 0 ? (totalItems / orders.length).toFixed(1) : "0";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Status Distribution Pie Chart */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {statusData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Orders Line Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders (Last 7 Days)</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.fullDate}</div>
                        <div className="text-sm text-muted-foreground">
                          Orders: {data.orders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Items: {data.items}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Items per Status Bar Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items by Status</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={itemsPerStatus}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="items" radius={[4, 4, 0, 0]}>
                {itemsPerStatus.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <span className="font-bold text-lg">{totalItems}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Items/Order</span>
            <span className="font-bold text-lg">{avgItemsPerOrder}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <span className="font-bold text-lg text-primary">
              {orders.filter((o) => !["ready", "delivered"].includes(o.status)).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completed Today</span>
            <span className="font-bold text-lg text-green-600">
              {orders.filter((o) => {
                const today = startOfDay(new Date());
                const orderDate = startOfDay(new Date(o.createdAt));
                return o.status === "delivered" && orderDate.getTime() === today.getTime();
              }).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
