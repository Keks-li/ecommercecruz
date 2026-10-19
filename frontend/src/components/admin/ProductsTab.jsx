import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Power,
  SlidersHorizontal,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../services/api';
import MercuryCard from './mercury/MercuryCard';
import MercuryKpiCard from './mercury/MercuryKpiCard';
import MercuryTable from './mercury/MercuryTable';
import MercuryButton from './mercury/MercuryButton';
import MercuryInput from './mercury/MercuryInput';
import MercuryBadge from './mercury/MercuryBadge';
import MercuryModal from './mercury/MercuryModal';

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paymentRules, setPaymentRules] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const { data } = await api.get('/admin/orders/payment-rules');
      setPaymentRules(data || []);
    } catch (err) {
      console.error('Failed to load payment rules:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRules();
  }, []);

  const handleToggleStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const { data: updated } = await api.patch(`/admin/products/${productId}/status`, {
        status: newStatus,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    for (let [key, value] of formData.entries()) {
      if (!value) formData.delete(key);
    }

    try {
      if (modalMode === 'add') {
        const { data } = await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts((prev) => [data, ...prev]);
      } else {
        const { data } = await api.patch(`/admin/products/${currentProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.price || 0), 0) / products.length
      : 0;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.unique_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = (p.stock || 0) > 5;
    else if (stockFilter === 'LOW_STOCK') matchesStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = (p.stock || 0) <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const columns = [
    {
      header: 'Product',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt=""
              className="w-9 h-9 rounded-[6px] object-cover border border-[#E1E4E8] bg-[#FAFAFB]"
            />
          ) : (
            <div className="w-9 h-9 rounded-[6px] bg-[#F4F5F7] border border-[#E1E4E8] flex items-center justify-center text-[#8B93A1]">
              <Package className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <div className="font-medium text-[#1B1D22]">{row.name}</div>
            <div className="text-[11px] text-[#8B93A1] font-mono tracking-tight">
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
      header: 'Price',
      key: 'price',
      isNumeric: true,
      render: (row) => (
        <span className="font-mono tabular-nums font-semibold text-[#1B1D22]">
          GH₵ {Number(row.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Stock',
      key: 'stock',
      isNumeric: true,
      render: (row) => {
        const stock = row.stock || 0;
        let variant = 'success';
        if (stock <= 0) variant = 'danger';
        else if (stock <= 5) variant = 'warning';

        return (
          <MercuryBadge variant={variant}>
            {stock <= 0 ? 'Out of Stock' : `${stock} units`}
          </MercuryBadge>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <MercuryBadge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>
          {row.status === 'ACTIVE' ? 'Active' : 'Suspended'}
        </MercuryBadge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <MercuryButton
            size="sm"
            variant="secondary"
            icon={Edit2}
            onClick={() => openEditModal(row)}
          >
            Edit
          </MercuryButton>
          <MercuryButton
            size="sm"
            variant={row.status === 'ACTIVE' ? 'destructive' : 'secondary'}
            icon={Power}
            onClick={() => handleToggleStatus(row.id, row.status)}
          >
            {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </MercuryButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#1B1D22] tracking-tight mercury-title">
            Products Catalog
          </h1>
          <p className="text-[13px] text-[#5F6877] mt-0.5">
            Manage live pricing, stock counts, and payment policy links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MercuryButton
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchProducts}
            disabled={loading}
          >
            Refresh
          </MercuryButton>
          <MercuryButton
            variant="primary"
            icon={Plus}
            onClick={openAddModal}
          >
            Add Product
          </MercuryButton>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MercuryKpiCard
          label="Total Products"
          value={products.length}
          delta="+2 this week"
          deltaType="positive"
          icon={Package}
        />
        <MercuryKpiCard
          label="Active Storefront Listings"
          value={activeCount}
          delta={`${products.length - activeCount} suspended`}
          deltaType={products.length - activeCount > 0 ? 'neutral' : 'positive'}
          icon={Archive}
        />
        <MercuryKpiCard
          label="Low Stock Watchlist"
          value={lowStockCount}
          delta={lowStockCount > 0 ? 'Restock needed' : 'Optimal'}
          deltaType={lowStockCount > 0 ? 'negative' : 'positive'}
          deltaPeriod="≤ 5 units"
          icon={Archive}
        />
        <MercuryKpiCard
          label="Average Product Price"
          value={`GH₵ ${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext="Catalog mean"
          icon={Package}
        />
      </div>

      {/* Filters Bar */}
      <MercuryCard padding="sm" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <MercuryInput
              placeholder="Search by name, SKU or 8-char code..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                stockFilter === 'ALL'
                  ? 'bg-[#EEF0FD] text-[#5266EB]'
                  : 'text-[#5F6877] hover:bg-[#F4F5F7]'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-[#EEF0FD] text-[#5266EB]'
                  : 'text-[#5F6877] hover:bg-[#F4F5F7]'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-[#F4F5F7]">
          {['ALL', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#EEF0FD] text-[#5266EB]'
                  : 'text-[#5F6877] hover:bg-[#F4F5F7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </MercuryCard>

      {/* Products Table */}
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
            Bulk Price Update
          </MercuryButton>
        }
        emptyMessage="No products match your filter search."
      />

      {/* Add / Edit Product Modal */}
      <MercuryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
        description="Configure product name, pricing, stock count, and images."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <MercuryInput
            label="Product Title"
            name="name"
            defaultValue={currentProduct?.name || ''}
            required
            placeholder="e.g. Samsung Double-Door Refrigerator"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MercuryInput
              label="Price (GH₵)"
              name="price"
              type="number"
              step="0.01"
              defaultValue={currentProduct?.price || ''}
              required
              placeholder="0.00"
            />
            <MercuryInput
              label="Warehouse Stock"
              name="stock"
              type="number"
              defaultValue={currentProduct?.stock || 0}
              required
              placeholder="10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1B1D22] mb-1.5">
                Category
              </label>
              <select
                name="category"
                defaultValue={currentProduct?.category || 'Phones'}
                className="w-full h-9 sm:h-10 bg-white border border-[#CDD1D8] rounded-[8px] text-[13px] px-3 text-[#1B1D22] focus:border-[#5266EB] focus:ring-2 focus:ring-[#5266EB]/25 focus:outline-none"
              >
                <option value="Phones">Phones</option>
                <option value="Refrigerators">Refrigerators</option>
                <option value="Washing">Washing</option>
                <option value="AC Units">AC Units</option>
                <option value="Microwaves">Microwaves</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1B1D22] mb-1.5">
                Product Type
              </label>
              <select
                name="type"
                defaultValue={currentProduct?.type || 'SINGLE'}
                className="w-full h-9 sm:h-10 bg-white border border-[#CDD1D8] rounded-[8px] text-[13px] px-3 text-[#1B1D22] focus:border-[#5266EB] focus:ring-2 focus:ring-[#5266EB]/25 focus:outline-none"
              >
                <option value="SINGLE">Single Item</option>
                <option value="COMBO">Combo Bundle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1B1D22] mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={currentProduct?.description || ''}
              placeholder="Product specs, warranty details, and specifications..."
              className="w-full bg-white border border-[#CDD1D8] rounded-[8px] text-[13px] p-3 text-[#1B1D22] focus:border-[#5266EB] focus:ring-2 focus:ring-[#5266EB]/25 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1B1D22] mb-1.5">
              Product Image File (Cloudinary)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full text-[13px] text-[#5F6877] file:mr-3 file:py-1.5 file:px-3 file:rounded-[6px] file:border file:border-[#CDD1D8] file:bg-[#F4F5F7] file:text-[12px] file:font-medium file:text-[#1B1D22] hover:file:bg-[#ECEEF1] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E1E4E8]">
            <MercuryButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </MercuryButton>
            <MercuryButton variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : modalMode === 'add' ? 'Create Product' : 'Save Changes'}
            </MercuryButton>
          </div>
        </form>
      </MercuryModal>
    </div>
  );
}
