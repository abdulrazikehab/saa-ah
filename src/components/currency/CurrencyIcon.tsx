import React from 'react';
import { getCurrencyIconConfig, type CurrencyIconConfig } from '@/lib/currency-icon-config';
import { cn } from '@/lib/utils';

interface CurrencyIconProps {
  currencyCode: string;
  size?: number | string;
  className?: string;
  showFallback?: boolean;
}

/**
 * Currency Icon Component
 * 
 * Renders currency icons based on type:
 * - Unicode: Renders as text
 * - SVG: Renders as <img> or inline SVG
 * - Fallback: Shows ISO code if icon is missing
 */
export function CurrencyIcon({ 
  currencyCode, 
  size = 24, 
  className,
  showFallback = true 
}: CurrencyIconProps) {
  const code = currencyCode.toUpperCase();
  const config = getCurrencyIconConfig(code);
  
  // Fallback: Show ISO code if no config
  if (!config) {
    if (!showFallback) return null;
    return (
      <div 
        className={cn(
          "flex items-center justify-center font-mono font-semibold text-xs",
          "bg-muted rounded border",
          className
        )}
        style={{ width: size, height: size }}
      >
        {code}
      </div>
    );
  }
  
  // Render based on type
  if (config.type === 'unicode') {
    // Unicode-based: Render as text
    return (
      <div
        className={cn(
          "flex items-center justify-center font-semibold",
          "bg-background rounded border border-border",
          className
        )}
        style={{ 
          width: size, 
          height: size,
          fontSize: typeof size === 'number' ? `${size * 0.6}px` : size
        }}
        title={`${config.name} (${code})`}
      >
        {config.value}
      </div>
    );
  }
  
  // SVG-based: Render as image
  if (config.type === 'svg') {
    return (
      <img
        src={config.value}
        alt={`${config.name} (${code})`}
        className={cn(
          "object-contain",
          className
        )}
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback to ISO code if SVG fails to load
          if (showFallback) {
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="flex items-center justify-center font-mono font-semibold text-xs bg-muted rounded border" style="width: ${size}px; height: ${size}px">${code}</div>`;
            }
          }
        }}
      />
    );
  }
  
  // Final fallback
  if (!showFallback) return null;
  return (
    <div 
      className={cn(
        "flex items-center justify-center font-mono font-semibold text-xs",
        "bg-muted rounded border",
        className
      )}
      style={{ width: size, height: size }}
    >
      {code}
    </div>
  );
}

/**
 * Currency Icon for use in selectors/lists
 * Optimized for smaller sizes
 */
export function CurrencyIconSmall({ currencyCode, className }: { currencyCode: string; className?: string }) {
  return <CurrencyIcon currencyCode={currencyCode} size={20} className={className} />;
}

/**
 * Currency Icon for use in cards/headers
 * Optimized for medium sizes
 */
export function CurrencyIconMedium({ currencyCode, className }: { currencyCode: string; className?: string }) {
  return <CurrencyIcon currencyCode={currencyCode} size={32} className={className} />;
}

/**
 * Currency Icon for use in large displays
 * Optimized for large sizes
 */
export function CurrencyIconLarge({ currencyCode, className }: { currencyCode: string; className?: string }) {
  return <CurrencyIcon currencyCode={currencyCode} size={64} className={className} />;
}

