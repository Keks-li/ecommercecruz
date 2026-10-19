import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryModal from './mercury/MercuryModal';

export default function InventoryTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStock, setFilterStock] = useState('all'); // 'all' | 'low' | 'out'
  const [editingProduct, setEditingProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalStockItems = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const totalValuation = products.reduce(
    (acc, p) => acc + (p.stock || 0) * Number(p.price || 0),
    0
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.unique_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStock === 'low') return (p.stock || 0) > 0 && (p.stock || 0) <= 5;
    if (filterStock === 'out') return (p.stock || 0) <= 0;
    return true;
  });

  const handleUpdateStock = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      await api.patch(`/admin/products/${editingProduct.id}`, {
        stock: parseInt(newStock, 10),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, stock: parseInt(newStock, 10) } : p
        )
      );
      setEditingProduct(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Item',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt=""
              className="w-8 h-8 rounded-[6px] object-cover border border-[#E1E4E8] bg-[#FAFAFB]"
            />
          ) : (
            <div className="w-8 h-8 rounded-[6px] bg-[#F4F5F7] border border-[#E1E4E8] flex items-center justify-center text-[#8B93A1]">
              <Archive className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <div className="font-medium text-[#1B1D22]">{row.name}</div>
            <div className="text-[11px] text-[#8B93A1] font-mono tabular-nums">
              {row.unique_code || `#${row.id}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      accessor: 'category',
      cellClassName: 'text-[#5F6877]',
    },
    {
      header: 'Unit Price',
      key: 'price',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums">
          GH₵ {Number(row.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Stock Level',
      key: 'stock',
      isNumeric: true,
      render: (row) => {
        const stock = row.stock || 0;
        let badgeVariant = 'success';
        let label = `${stock} in stock`;

        if (stock <= 0) {
          badgeVariant = 'danger';
          label = 'Out of stock';
        } else if (stock <= 5) {
          badgeVariant = 'warning';
          label = `${stock} low stock`;
        }

        return <MercuryBadge variant={badgeVariant}>{label}</MercuryBadge>;
      },
    },
    {
      header: 'Total Value',
      key: 'valuation',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[#5F6877]">
          GH₵ {((row.stock || 0) * Number(row.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <MercuryButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingProduct(row);
              setNewStock(row.stock || 0);
            }}
          >
            Adjust Stock
          </MercuryButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Inventory &amp; Stock
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Real-time warehouse levels, reorder thresholds, and inventory valuation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchInventory}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Total Units On Hand"
          value={totalStockItems.toLocaleString()}
          delta="+4.2%"
          deltaType="positive"
          deltaPeriod="vs last month"
          icon={Archive}
        />
        <MercuryKpiCard
          label="Inventory Valuation"
          value={`GH₵ ${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext="Cost basis"
          icon={ArrowUpDown}
        />
        <MercuryKpiCard
          label="Low Stock Alerts"
          value={lowStockCount}
          delta={lowStockCount > 0 ? `${lowStockCount} items` : 'Normal'}
          deltaType={lowStockCount > 0 ? 'negative' : 'positive'}
          deltaPeriod="threshold ≤ 5"
          icon={AlertTriangle}
        />
        <MercuryKpiCard
          label="Stockout Items"
          value={outOfStockCount}
          delta={outOfStockCount > 0 ? 'Action needed' : 'Optimal'}
          deltaType={outOfStockCount > 0 ? 'negative' : 'positive'}
          deltaPeriod="immediate reorder"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter and Search Bar */}
      <MercuryCard padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <MercuryInput
            placeholder="Search SKU, item name or category..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStock('all')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStock === 'all'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setFilterStock('low')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStock === 'low'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStock('out')}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              filterStock === 'out'
                ? 'bg-[#EEF0FD] text-[#5266EB]'
                : 'text-[#5F6877] hover:bg-[#F4F5F7]'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </MercuryCard>

      {/* Inventory Table */}
      <MercuryTable
        columns={columns}
        data={filteredProducts}
        keyField="id"
        isLoading={loading}
        selectedIds={selectedIds}
        onSelectRow={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
        onSelectAll={() =>
          setSelectedIds(
            selectedIds.length === filteredProducts.length
              ? []
              : filteredProducts.map((p) => p.id)
          )
        }
        bulkActions={
          <MercuryButton size="sm" variant="secondary">
            Batch Export CSV
          </MercuryButton>
        }
        emptyMessage="No inventory items found matching your filters."
      />

      {/* Adjust Stock Modal */}
      <MercuryModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Adjust Inventory Count"
        description={`Set verified warehouse physical stock count for ${editingProduct?.name}`}
        footer={
          <>
            <MercuryButton variant="secondary" onClick={() => setEditingProduct(null)}>
              Cancel
            </MercuryButton>
            <MercuryButton variant="primary" onClick={handleUpdateStock} disabled={saving}>
              {saving ? 'Updating...' : 'Save Stock Count'}
            </MercuryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#F4F5F7] rounded-[8px] border border-[#E1E4E8] text-[13px]">
            <div className="text-[#5F6877]">SKU / Code:</div>
            <div className="font-mono text-[#1B1D22] font-semibold">{editingProduct?.unique_code}</div>
          </div>
          <MercuryInput
            label="Verified Quantity in Stock"
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            helper="Physical inventory count after stocktaking reconciliation"
          />
        </div>
      </MercuryModal>
    </div>
  );
}
