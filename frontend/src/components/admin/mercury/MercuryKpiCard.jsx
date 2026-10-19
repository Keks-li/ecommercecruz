import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import MercuryCard from './MercuryCard';

/**
 * MercuryKpiCard
 * Panel: white, 1px --ash-200 border, 20-24px padding.
 * Small ash-600 label on top, value in 28 to 32px tabular numbers,
 * delta as small text with an arrow in success or danger color. No sparkline fills.
 */
export default function MercuryKpiCard({
  label,
  value,
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral'
  deltaPeriod = 'vs last month',
  subtext,
  icon: Icon,
  className = '',
}) {
  const isPositive = deltaType === 'positive' || (typeof delta === 'number' && delta > 0);
  const isNegative = deltaType === 'negative' || (typeof delta === 'number' && delta < 0);

  return (
    <MercuryCard className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[13px] text-[#5F6877] font-medium leading-none">
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-[6px] bg-[#F4F5F7] flex items-center justify-center text-[#8B93A1]">
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div>
        <div className="text-[28px] sm:text-[32px] font-semibold text-[#1B1D22] tabular-nums tracking-tight leading-tight mb-2">
          {value}
        </div>

        {(delta !== undefined || subtext) && (
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            {delta !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 ${
                  isPositive
                    ? 'text-[#1E7B50]'
                    : isNegative
                    ? 'text-[#C02B2B]'
                    : 'text-[#5F6877]'
                }`}
              >
                {isPositive && <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />}
                {isNegative && <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2} />}
                <span>
                  {typeof delta === 'number'
                    ? `${delta > 0 ? '+' : ''}${delta}%`
                    : delta}
                </span>
              </span>
            )}
            {deltaPeriod && (
              <span className="text-[#8B93A1] font-normal">{deltaPeriod}</span>
            )}
            {subtext && <span className="text-[#8B93A1] font-normal">{subtext}</span>}
          </div>
        )}
      </div>
    </MercuryCard>
  );
}
