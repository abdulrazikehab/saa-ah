// Console logs enabled for debugging

// MOBILE APP TENANT INITIALIZATION
// Extract tenant context from hostname for nip.io domains used in mobile development
// This ensures the app knows which store's config to load
(function initMobileTenant() {
  const hostname = window.location.hostname;
  
  // Check if running in Capacitor/Native app context
  const isNativeApp = window.navigator.userAgent.includes('Capacitor') || window.location.protocol === 'file:';
  
  // Extract subdomain from nip.io URLs: subdomain.IP.nip.io -> subdomain
  // Also support localhost subdomains: subdomain.localhost
  if (hostname.endsWith('.nip.io') || hostname.endsWith('.localhost')) {
    const nipIoPattern = /^([a-z0-9-]+)\.\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\.nip\.io$/i;
    const localhostPattern = /^([a-z0-9-]+)\.localhost$/i;
    
    const match = hostname.match(nipIoPattern) || hostname.match(localhostPattern);
    if (match && match[1]) {
      const subdomain = match[1];
      if (subdomain !== 'localhost') {
        console.log('📱 [App] Detected subdomain:', subdomain);
        localStorage.setItem('storefrontTenantSubdomain', subdomain);
      }
      
      // DEV FIX: Explicitly set the known Tenant ID for this dev environment
      // This ensures pageService and other APIs find the correct content immediately
      // without needing to resolve the 'asus130' subdomain which might be missing in DB
      const DEV_TENANT_ID = 'c692ca44-bcea-4963-bb47-73957dd8b929';
      if (!localStorage.getItem('storefrontTenantId')) {
          console.log('📱 [App] Injecting DEV TENANT ID for local testing:', DEV_TENANT_ID);
          localStorage.setItem('storefrontTenantId', DEV_TENANT_ID);
      }
    }
  }
  
  // For native apps, log context
  if (isNativeApp) {
    console.log('📱 [App] Running as Native App, hostname:', hostname);
  }
})();

// THEME PREVIEW INITIALIZATION
// Apply theme colors from URL params immediately, before React renders
// This ensures the preview shows correct colors without waiting for React hydration
(function initThemePreview() {
  const searchParams = new URLSearchParams(window.location.search);
  const isLivePreview = searchParams.get('theme_preview') === 'live';
  const primaryColor = searchParams.get('primaryColor');
  const secondaryColor = searchParams.get('secondaryColor');
  const accentColor = searchParams.get('accentColor');
  const backgroundColor = searchParams.get('backgroundColor');
  const animationStyle = searchParams.get('animationStyle') || 'smooth';
  
  if (isLivePreview && (primaryColor || secondaryColor || accentColor)) {
    console.log('🎨 [Theme Preview] Applying colors from URL:', { primaryColor, secondaryColor, accentColor, backgroundColor, animationStyle });
    
    // Helper to convert HEX to HSL for Tailwind
    const hexToHsl = (hex: string): string => {
      const c = hex.replace('#', '');
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0, s = 0;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    
    // Build CSS with high specificity to override default theme
    let css = ':root, html, .light, .dark {\n';
    
    if (primaryColor) {
      const hsl = hexToHsl(primaryColor);
      css += `  --primary: ${hsl} !important;\n`;
      css += `  --theme-primary: ${primaryColor} !important;\n`;
      css += `  --ring: ${hsl} !important;\n`;
      console.log('🎨 [Theme Preview] Primary HSL:', hsl);
    }
    
    if (secondaryColor) {
      const hsl = hexToHsl(secondaryColor);
      css += `  --secondary: ${hsl} !important;\n`;
      css += `  --theme-secondary: ${secondaryColor} !important;\n`;
      console.log('🎨 [Theme Preview] Secondary HSL:', hsl);
    }
    
    if (accentColor) {
      const hsl = hexToHsl(accentColor);
      css += `  --accent: ${hsl} !important;\n`;
      css += `  --theme-accent: ${accentColor} !important;\n`;
      console.log('🎨 [Theme Preview] Accent HSL:', hsl);
    }
    
    if (backgroundColor) {
      const hsl = hexToHsl(backgroundColor);
      css += `  --background: ${hsl} !important;\n`;
      css += `  --theme-background: ${backgroundColor} !important;\n`;
      console.log('🎨 [Theme Preview] Background HSL:', hsl);
    }
    
    css += '}\n';
    
    // Animation duration settings based on animation style
    const animationDurations: Record<string, string> = {
      none: '0ms',
      subtle: '150ms',
      smooth: '300ms',
      dynamic: '500ms',
    };
    
    css += `:root { --animation-duration: ${animationDurations[animationStyle] || '300ms'} !important; }\n`;
    
    // Add animation class to body based on style
    document.documentElement.setAttribute('data-animation', animationStyle);
    
    // Inject style element into head
    const styleEl = document.createElement('style');
    styleEl.id = 'theme-preview-override';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    console.log('🎨 [Theme Preview] Injected style tag');
  }
})();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
