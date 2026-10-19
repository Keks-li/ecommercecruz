import React from 'react';

/**
 * MercuryTable
 * Header: --ash-50 (#F4F5F7) with 12px uppercase-free labels in ash-600.
 * Rows: 52px height, hairline row dividers (--ash-200), no zebra stripes.
 * Hover: --ash-50.
 * Bulk-select bar when items are selected.
 * Tabular figures for money and quantities.
 */
export default function MercuryTable({
  columns = [],
  data = [],
  keyField = 'id',
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  bulkActions,
  emptyMessage = 'No records found',
  isLoading = false,
  className = '',
}) {
  const isAllSelected =
    data.length > 0 && selectedIds.length === data.length;
  const isPartiallySelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className={`w-full bg-white border border-[#E1E4E8] rounded-[12px] overflow-hidden ${className}`}>
      {/* Bulk action bar if items are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#EEF0FD] border-b border-[#E1E4E8] text-[13px] text-[#1B1D22]">
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums text-[#5266EB]">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F5F7] border-b border-[#E1E4E8] h-10 select-none">
              {onSelectRow && (
                <th className="w-10 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded-[4px] border-[#CDD1D8] text-[#5266EB] accent-[#5266EB] focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-4 text-[12px] font-medium text-[#5F6877] tracking-normal normal-case ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E1E4E8]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0)}
                  className="px-4 py-12 text-center text-[13px] text-[#5F6877]"
                >
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#5266EB] border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0)}
                  className="px-4 py-12 text-center text-[13px] text-[#5F6877]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const isSelected = selectedIds.includes(row[keyField]);
                return (
                  <tr
                    key={row[keyField] || rowIdx}
                    className={`h-[52px] group transition-colors ${
                      isSelected ? 'bg-[#EEF0FD]' : 'bg-white hover:bg-[#F4F5F7]'
                    }`}
                  >
                    {onSelectRow && (
                      <td className="w-10 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(row[keyField])}
                          className="w-4 h-4 rounded-[4px] border-[#CDD1D8] text-[#5266EB] accent-[#5266EB] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => {
                      const cellValue = col.accessor
                        ? typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : row[col.accessor]
                        : null;

                      return (
                        <td
                          key={col.key || colIdx}
                          className={`px-4 text-[13px] text-[#1B1D22] ${
                            col.isNumeric ? 'tabular-nums font-mono text-right' : ''
                          } ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                            col.cellClassName || ''
                          }`}
                        >
                          {col.render ? col.render(row, cellValue) : cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
