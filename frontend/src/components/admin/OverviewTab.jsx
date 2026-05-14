import { useState, useEffect } from 'react';
import api from '../../services/api';

function StatCard({ title, value, prefix = '' }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col justify-center items-start">
      <h3 className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white tracking-tight">
        {prefix}{value}
      </p>
    </div>
  );
}

export default function OverviewTab() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalActiveUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        <div className="h-32 bg-slate-800 rounded-2xl"></div>
        <div className="h-32 bg-slate-800 rounded-2xl"></div>
        <div className="h-32 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={stats.totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })} prefix="₦" />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Active Customers" value={stats.totalActiveUsers} />
      </div>
    </div>
  );
}
