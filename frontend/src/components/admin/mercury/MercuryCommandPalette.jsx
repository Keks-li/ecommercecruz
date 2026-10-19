import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Archive,
  CreditCard,
  BarChart3,
  Settings,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

/**
 * MercuryCommandPalette
 * Triggered on Cmd/Ctrl+K or search click.
 * Search and jump between pages and core entities instantly.
 */
export default function MercuryCommandPalette({
  isOpen,
  onClose,
  onNavigate,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    { id: 'overview', label: 'Overview Dashboard', category: 'Navigation', icon: LayoutDashboard },
    { id: 'orders', label: 'All Customer Orders', category: 'Navigation', icon: ShoppingBag },
    { id: 'products', label: 'Product Catalog', category: 'Navigation', icon: Package },
    { id: 'customers', label: 'Customers & Users', category: 'Navigation', icon: Users },
    { id: 'inventory', label: 'Inventory & Stock Management', category: 'Navigation', icon: Archive },
    { id: 'payments', label: 'Payments & Payouts', category: 'Navigation', icon: CreditCard },
    { id: 'analytics', label: 'Analytics & Reporting', category: 'Navigation', icon: BarChart3 },
    { id: 'settings', label: 'Admin Settings & Policies', category: 'Navigation', icon: Settings },
    { id: 'audit-log', label: 'System Audit Logs', category: 'Quick Action', icon: FileText },
    { id: 'security', label: 'Account Security & Credentials', category: 'Quick Action', icon: ShieldCheck },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onNavigate(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div
        className="fixed inset-0 bg-[#1B1D22]/20 transition-opacity"
        onClick={onClose}
      />

      <div
        style={{ boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}
        className="relative w-full max-w-xl bg-white border border-[#E1E4E8] rounded-[12px] overflow-hidden z-10"
      >
        <div className="flex items-center px-4 border-b border-[#E1E4E8] h-12">
          <Search className="w-4 h-4 text-[#8B93A1] mr-3 shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page, command, or jump to section..."
            className="w-full text-[13px] text-[#1B1D22] placeholder:text-[#8B93A1] bg-transparent focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-[#8B93A1] bg-[#F4F5F7] border border-[#E1E4E8] rounded-[4px] font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-[#F4F5F7]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#5F6877]">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] text-left transition-colors ${
                    isSelected
                      ? 'bg-[#EEF0FD] text-[#5266EB]'
                      : 'text-[#1B1D22] hover:bg-[#F4F5F7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isSelected ? 'text-[#5266EB]' : 'text-[#8B93A1]'}`}
                      strokeWidth={1.5}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#8B93A1]">{item.category}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B93A1]" strokeWidth={1.5} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-[#FAFAFB] border-t border-[#E1E4E8] text-[11px] text-[#8B93A1]">
          <span>Navigation: <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
          <span>Select: <kbd className="font-mono">↵</kbd></span>
        </div>
      </div>
    </div>
  );
}
