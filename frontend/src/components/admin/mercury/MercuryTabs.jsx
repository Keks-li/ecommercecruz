import React from 'react';

/**
 * MercuryTabs
 * Underline style with a 2px --accent indicator.
 * Tab item height, clean padding, WCAG AA contrast.
 */
export default function MercuryTabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`border-b border-[#E1E4E8] w-full ${className}`}>
      <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`py-3 text-[13px] font-medium whitespace-nowrap transition-colors relative flex items-center gap-2 ${
                isActive
                  ? 'text-[#1B1D22]'
                  : 'text-[#5F6877] hover:text-[#1B1D22]'
              }`}
            >
              {tab.icon && (
                <tab.icon
                  className={`w-4 h-4 ${isActive ? 'text-[#1B1D22]' : 'text-[#8B93A1]'}`}
                  strokeWidth={1.5}
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-[4px] text-[11px] tabular-nums font-mono ${
                    isActive
                      ? 'bg-[#EEF0FD] text-[#5266EB]'
                      : 'bg-[#ECEEF1] text-[#5F6877]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5266EB]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
