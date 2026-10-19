import React, { useState } from 'react';

/**
 * MercuryChart
 * Rules: Flat solid strokes and bars, accent as primary series (#5266EB),
 * ash-300 and ash-500 as secondary. NO area gradients.
 * Thin gridlines in --ash-100 (#ECEEF1).
 */
export default function MercuryChart({
  type = 'line', // 'line' | 'bar'
  data = [], // [{ label: 'Mon', value: 120, secondary: 80 }]
  height = 200,
  valuePrefix = 'GH₵ ',
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => Math.max(d.value || 0, d.secondary || 0)), 1);
  const paddingX = 40;
  const paddingY = 24;
  const width = 600; // viewBox width

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Grid lines (3 horizontal lines)
  const gridLevels = [0, 0.5, 1];

  // Coordinates for line series
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Thin gridlines in --ash-100 */}
        {gridLevels.map((lvl) => {
          const y = paddingY + chartHeight - lvl * chartHeight;
          const val = Math.round(lvl * maxValue);
          return (
            <g key={lvl}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#ECEEF1"
                strokeWidth={1}
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-[#8B93A1] font-mono tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {type === 'line' ? (
          <>
            {/* Primary line: solid --accent (#5266EB), 2px, NO gradient fill */}
            <path
              d={pathD}
              fill="none"
              stroke="#5266EB"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Points */}
            {points.map((pt, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 3}
                    fill="#FFFFFF"
                    stroke="#5266EB"
                    strokeWidth={isHovered ? 2 : 1.5}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {/* Invisible hit target */}
                  <rect
                    x={pt.x - 15}
                    y={0}
                    width={30}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })}
          </>
        ) : (
          /* Bar chart: flat solid bars */
          <g>
            {data.map((d, i) => {
              const groupWidth = chartWidth / data.length;
              const barWidth = Math.min(groupWidth * 0.45, 24);
              const x = paddingX + i * groupWidth + (groupWidth - barWidth) / 2;
              const barH = (d.value / maxValue) * chartHeight;
              const y = paddingY + chartHeight - barH;
              const isHovered = hoveredIdx === i;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx={4}
                    fill={isHovered ? '#4355D6' : '#5266EB'}
                    className="cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {/* Optional secondary bar */}
                  {d.secondary !== undefined && (
                    <rect
                      x={x + barWidth / 2}
                      y={paddingY + chartHeight - (d.secondary / maxValue) * chartHeight}
                      width={barWidth / 2}
                      height={(d.secondary / maxValue) * chartHeight}
                      rx={2}
                      fill="#CDD1D8"
                      className="cursor-pointer"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
          return (
            <text
              key={i}
              x={x}
              y={height - 6}
              textAnchor="middle"
              className="text-[11px] fill-[#8B93A1] select-none"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {/* Floating flat tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            left: `${((points[hoveredIdx]?.x || 0) / width) * 100}%`,
            top: `${((points[hoveredIdx]?.y || 0) / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
          }}
          className="absolute bg-white border border-[#E1E4E8] rounded-[6px] px-2.5 py-1 text-[12px] pointer-events-none z-10 whitespace-nowrap"
        >
          <span className="text-[#5F6877] mr-1.5">{data[hoveredIdx].label}:</span>
          <span className="font-semibold text-[#1B1D22] tabular-nums font-mono">
            {valuePrefix}
            {Number(data[hoveredIdx].value).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
