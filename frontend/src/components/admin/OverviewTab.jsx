import { useState, useEffect } from 'react';
import api from '../../services/api';

// ── Icons ────────────────────────────────────────────────────────────────────
const RevenueIcon = () => (
  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CustomersIcon = () => (
  <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PendingIcon = () => (
  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// ── Metrics Stat Card ────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, trend, colorClass = "from-slate-900/60 to-slate-900/40" }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClass} border border-slate-700/40 rounded-2xl p-6 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all duration-300 group`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <h3 className="text-slate-400 text-xs font-semibold tracking-wider uppercase">{title}</h3>
          <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>}
              {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-inner group-hover:border-slate-600 transition-colors">
          <Icon />
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart view states
  const [chartPeriod, setChartPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'sales'

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-rose-400 bg-rose-500/15 p-5 rounded-2xl border border-rose-500/30 flex items-center gap-3">
        <WarningIcon />
        <div>
          <h4 className="font-bold text-rose-200">Failed to load statistics</h4>
          <p className="text-sm text-rose-400/90">{error}</p>
        </div>
      </div>
    );
  }

  // Active chart data list
  const activeChartData = stats?.charts?.[chartPeriod] || [];
  
  // Calculate max value for SVG chart scaling
  const maxMetricValue = activeChartData.reduce((max, item) => {
    const val = chartMetric === 'revenue' ? item.revenue : item.sales;
    return val > max ? val : max;
  }, 1) || 1;

  return (
    <div className="space-y-8 pb-12">
      {/* Greetings Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-400 mt-1">Here is a comprehensive summary of Cruzaro's platform performance.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₦${Number(stats.totalRevenue).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
          subtitle="All-time customer payments"
          icon={RevenueIcon}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle="Placed by customers"
          icon={OrdersIcon}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          subtitle={`${stats.totalActiveUsers} currently active`}
          icon={CustomersIcon}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          subtitle="Awaiting processing"
          icon={PendingIcon}
          colorClass={stats.pendingOrders > 0 ? "from-slate-900/60 to-amber-900/10 border-amber-500/20" : "from-slate-900/60 to-slate-900/40"}
        />
      </div>

      {/* Temporal Sales Breakdown */}
      <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-6 shadow-xl shadow-black/10">
        <h3 className="text-slate-200 font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          Temporal Sales & Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          {/* Today */}
          <div className="pt-4 md:pt-0 md:px-4 first:pl-0 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Performance</span>
            <p className="text-2xl font-extrabold text-white">₦{Number(stats.salesTodayRevenue).toLocaleString('en-NG')}</p>
            <p className="text-sm text-slate-400 font-medium">{stats.salesTodayCount} orders completed</p>
          </div>
          {/* Week */}
          <div className="pt-4 md:pt-0 md:px-4 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 7 Days</span>
            <p className="text-2xl font-extrabold text-indigo-400">₦{Number(stats.salesWeekRevenue).toLocaleString('en-NG')}</p>
            <p className="text-sm text-slate-400 font-medium">{stats.salesWeekCount} orders completed</p>
          </div>
          {/* Month */}
          <div className="pt-4 md:pt-0 md:px-4 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 30 Days</span>
            <p className="text-2xl font-extrabold text-emerald-400">₦{Number(stats.salesMonthRevenue).toLocaleString('en-NG')}</p>
            <p className="text-sm text-slate-400 font-medium">{stats.salesMonthCount} orders completed</p>
          </div>
        </div>
      </div>

      {/* Inventory & Low Stock Alert Feed */}
      {stats.lowStockProductsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl p-6 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 text-rose-400 mb-4">
            <WarningIcon />
            <h3 className="font-bold text-lg text-rose-200">Critical Stock Warning ({stats.lowStockProductsCount} Products)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.lowStockProductsList.map((prod) => (
              <div key={prod.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <img src={prod.image_url} alt={prod.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-slate-200 text-sm font-semibold truncate">{prod.name}</h4>
                  <p className="text-xs text-rose-400 font-bold mt-0.5">Only {prod.stock} left in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Interactive Analytics Chart */}
      <div className="bg-[#0f1524] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-white font-bold text-xl tracking-tight">Interactive Performance Charts</h3>
            <p className="text-slate-400 text-sm mt-0.5">Track sales frequency and revenue spikes across custom intervals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  chartMetric === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  chartMetric === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sales Count
              </button>
            </div>

            {/* Period selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
              {['daily', 'weekly', 'monthly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    chartPeriod === period ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Pure SVG Visualization Chart */}
        <div className="relative pt-4 px-2">
          {activeChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/25 border border-dashed border-slate-800 rounded-2xl">
              No transaction history found for the active scope.
            </div>
          ) : (
            <div>
              {/* SVG Area/Bar chart */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px] h-72 flex items-end justify-between gap-6 pb-2 border-b border-slate-800">
                  {activeChartData.map((item, idx) => {
                    const itemValue = chartMetric === 'revenue' ? item.revenue : item.sales;
                    const heightPercent = Math.max(10, (itemValue / maxMetricValue) * 80); // bound height between 10% and 90%
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative cursor-pointer">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-[105%] bg-slate-900 border border-slate-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition duration-200 z-10 pointer-events-none scale-90 group-hover:scale-100 text-center whitespace-nowrap">
                          {chartMetric === 'revenue' ? `₦${Number(itemValue).toLocaleString('en-NG')}` : `${itemValue} Orders`}
                        </div>

                        {/* Bar Segment */}
                        <div className="w-full relative rounded-t-lg overflow-hidden flex flex-col justify-end bg-slate-900/50 border border-slate-800/40 h-56">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-md transition-all duration-700 origin-bottom scale-y-100 bg-gradient-to-t ${
                              chartMetric === 'revenue' ? 'from-emerald-600/20 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 'from-indigo-600/20 to-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.1)]'
                            }`}
                          />
                        </div>

                        {/* Label */}
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products Card */}
        <div className="bg-[#0f1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">Top Selling Products</h3>
              <p className="text-slate-400 text-xs mt-0.5">Top performing items by quantity sold.</p>
            </div>
            <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">Top 5</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {!stats.topSellingProducts || stats.topSellingProducts.length === 0 ? (
              <p className="text-center text-slate-500 py-10 text-sm">No sales logged yet.</p>
            ) : (
              stats.topSellingProducts.map((prod) => (
                <div key={prod.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-slate-200 text-sm font-semibold truncate">{prod.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{prod.unique_code}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-bold">{prod.quantitySold} units sold</p>
                    <p className="text-xs text-indigo-400 font-medium mt-0.5">₦{Number(prod.totalRevenue).toLocaleString('en-NG')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Feed Card */}
        <div className="bg-[#0f1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">Recent Orders</h3>
              <p className="text-slate-400 text-xs mt-0.5">Real-time checkout feed from customers.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Live feed</span>
          </div>

          <div className="space-y-4">
            {!stats.recentOrders || stats.recentOrders.length === 0 ? (
              <p className="text-center text-slate-500 py-10 text-sm">No orders registered yet.</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 rounded-xl p-4 transition-colors flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-semibold truncate">{order.customerEmail}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Order #CRZ-{order.id.toString().padStart(5, '0')} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2 mt-1">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {order.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                    </span>
                    <span className="text-white font-bold shrink-0">
                      ₦{Number(order.totalPrice).toLocaleString('en-NG')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
