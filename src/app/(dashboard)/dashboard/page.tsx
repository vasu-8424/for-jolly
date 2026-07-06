import { PageTransition } from "@/components/layout/page-transition";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { TopProducts } from "@/components/dashboard/top-products";
import { SystemStatus } from "@/components/dashboard/system-status";

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-8 pb-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WelcomeBanner />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>

        {/* Metrics Section */}
        <MetricCards />

        {/* Analytics & Layout Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart />
            <RecentOrders />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <LowStockWidget />
            <TopProducts />
            <SystemStatus />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
