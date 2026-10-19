import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import MercuryButton from './MercuryButton';

/**
 * MercuryModal
 * Flat panel: white surface, 1px hairline border, radius 12px,
 * very faint shadow 0 1px 2px rgba(16,24,40,0.04). No glass, blur or glow.
 */
export default function MercuryModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Crisp flat backdrop */}
      <div
        className="fixed inset-0 bg-[#1B1D22]/20 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        style={{ boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}
        className={`relative w-full ${maxWidth} bg-white border border-[#E1E4E8] rounded-[12px] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#E1E4E8]">
            <div>
              {title && (
                <h3 className="text-[16px] font-semibold text-[#1B1D22] tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[13px] text-[#5F6877] mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[#8B93A1] hover:text-[#1B1D22] p-1 rounded-[6px] hover:bg-[#F4F5F7] transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FAFAFB] border-t border-[#E1E4E8]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
