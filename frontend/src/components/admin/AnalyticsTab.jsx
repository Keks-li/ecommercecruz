import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Repeat,
  RotateCcw,
  RefreshCw,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryChart from './mercury/MercuryChart';
import MercuryButton from './mercury/MercuryButton';
import MercuryBadge from './mercury/MercuryBadge';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  // Flat sales volume data for chart
  const salesTrendData = [
    { label: 'Oct 01', value: 1800 },
    { label: 'Oct 04', value: 2400 },
    { label: 'Oct 07', value: 1950 },
    { label: 'Oct 10', value: 3100 },
    { label: 'Oct 13', value: 2800 },
    { label: 'Oct 16', value: 4200 },
    { label: 'Oct 19', value: 3850 },
  ];

  // Category sales bar chart data
  const categoryBarData = [
    { label: 'Phones', value: 14500, secondary: 3200 },
    { label: 'Refrigerators', value: 9800, secondary: 2100 },
    { label: 'Washing', value: 6400, secondary: 1400 },
    { label: 'AC Units', value: 8900, secondary: 1800 },
    { label: 'Microwaves', value: 3200, secondary: 850 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Analytics &amp; Performance
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Storefront conversion metrics, product demand, and sales velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#F4F5F7] border border-[#E1E4E8] rounded-[8px] p-0.5">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-[#1B1D22] border border-[#E1E4E8]'
                    : 'text-[#5F6877] hover:text-[#1B1D22]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 300);
            }}
          >
            Refresh
          </MercuryButton>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Average Order Value"
          value="GH₵ 1,420.00"
          delta="+6.8%"
          deltaType="positive"
          deltaPeriod="vs previous 30d"
          icon={TrendingUp}
        />
        <MercuryKpiCard
          label="Checkout Conversion"
          value="3.84%"
          delta="+0.4%"
          deltaType="positive"
          deltaPeriod="visitors to orders"
          icon={Percent}
        />
        <MercuryKpiCard
          label="Customer Repeat Rate"
          value="24.2%"
          delta="+1.9%"
          deltaType="positive"
          deltaPeriod="returning buyers"
          icon={Repeat}
        />
        <MercuryKpiCard
          label="Return / Dispute Rate"
          value="0.35%"
          delta="-0.1%"
          deltaType="positive"
          deltaPeriod="below threshold"
          icon={RotateCcw}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Line Chart */}
        <MercuryCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1B1D22]">Sales Trajectory</h3>
              <p className="text-[12px] text-[#5F6877]">Daily gross sales volume across all channels</p>
            </div>
            <span className="text-[12px] font-mono text-[#5266EB] bg-[#EEF0FD] px-2 py-0.5 rounded-[4px]">
              Solid Line (No gradients)
            </span>
          </div>

          <MercuryChart
            type="line"
            data={salesTrendData}
            height={220}
            valuePrefix="GH₵ "
          />

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E1E4E8] text-[12px] text-[#5F6877]">
            <span>Peak Day: <strong className="text-[#1B1D22]">Oct 16 (GH₵ 4,200)</strong></span>
            <span>Average Run Rate: <strong className="text-[#1B1D22]">GH₵ 2,950 / day</strong></span>
          </div>
        </MercuryCard>

        {/* Category Breakdown Bar Chart */}
        <MercuryCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1B1D22]">Revenue by Category</h3>
              <p className="text-[12px] text-[#5F6877]">Solid bars: Primary sales vs secondary warranty</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#5F6877]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#5266EB]" /> Gross Sales
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#CDD1D8]" /> Add-ons
              </span>
            </div>
          </div>

          <MercuryChart
            type="bar"
            data={categoryBarData}
            height={220}
            valuePrefix="GH₵ "
          />

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E1E4E8] text-[12px] text-[#5F6877]">
            <span>Top Category: <strong className="text-[#1B1D22]">Phones (GH₵ 14,500)</strong></span>
            <span>Contribution: <strong className="text-[#1B1D22]">33.8% of total catalog</strong></span>
          </div>
        </MercuryCard>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MercuryCard className="space-y-3">
          <h4 className="text-[13px] font-semibold text-[#1B1D22]">Payment Method Share</h4>
          <div className="space-y-2">
            {[
              { label: 'MTN Mobile Money', pct: 64, color: '#5266EB' },
              { label: 'Telecel Cash', pct: 18, color: '#8B93A1' },
              { label: 'Debit / Credit Card', pct: 14, color: '#CDD1D8' },
              { label: 'Cash / Bank Transfer', pct: 4, color: '#E1E4E8' },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#5F6877]">{m.label}</span>
                  <span className="font-mono tabular-nums text-[#1B1D22] font-medium">{m.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#ECEEF1] rounded-[2px] overflow-hidden">
                  <div
                    style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                    className="h-full rounded-[2px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </MercuryCard>

        <MercuryCard className="space-y-3">
          <h4 className="text-[13px] font-semibold text-[#1B1D22]">Top Fulfillment Regions</h4>
          <div className="space-y-2">
            {[
              { label: 'Greater Accra', orders: 142, revenue: 'GH₵ 82,400' },
              { label: 'Ashanti (Kumasi)', orders: 68, revenue: 'GH₵ 41,200' },
              { label: 'Western (Takoradi)', orders: 24, revenue: 'GH₵ 15,800' },
              { label: 'Central (Cape Coast)', orders: 18, revenue: 'GH₵ 9,600' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-[12px] py-1 border-b border-[#F4F5F7] last:border-0">
                <span className="text-[#1B1D22] font-medium">{r.label}</span>
                <div className="text-right">
                  <span className="font-mono tabular-nums text-[#5F6877] mr-2">{r.orders} orders</span>
                  <span className="font-mono tabular-nums text-[#1B1D22] font-semibold">{r.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </MercuryCard>

        <MercuryCard className="space-y-3">
          <h4 className="text-[13px] font-semibold text-[#1B1D22]">Device &amp; Platform Ratio</h4>
          <div className="space-y-2">
            {[
              { label: 'Mobile Web (Safari & Chrome)', pct: 78 },
              { label: 'Desktop (Chrome & Edge)', pct: 19 },
              { label: 'Tablet & iPad', pct: 3 },
            ].map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#5F6877]">{d.label}</span>
                  <span className="font-mono tabular-nums text-[#1B1D22] font-medium">{d.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#ECEEF1] rounded-[2px] overflow-hidden">
                  <div
                    style={{ width: `${d.pct}%`, backgroundColor: '#5266EB' }}
                    className="h-full rounded-[2px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </MercuryCard>
      </div>
    </div>
  );
}
