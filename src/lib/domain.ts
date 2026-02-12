import { Capacitor } from '@capacitor/core';
// Optional if you have ionic, but capacitor core is enough

// Dynamic Domain Resolution
const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
const secondaryDomain = import.meta.env.VITE_PLATFORM_SECONDARY_DOMAIN || 'saeaa.net';

export const mainDomains = [
  'localhost', 
  '127.0.0.1', 
  platformDomain,
  `www.${platformDomain}`,
  `app.${platformDomain}`,
  secondaryDomain,
  `www.${secondaryDomain}`,
  `app.${secondaryDomain}`,
  'www.saeaa.com', 
  'saeaa.com', 
  'app.saeaa.com',
  'www.saeaa.net',
  'saeaa.net',
  'app.saeaa.net',
  'www.saeaa.com', 
  'saeaa.com', 
  'app.saeaa.com',
  'www.saeaa.net',
  'saeaa.net',
  'app.saeaa.net',
];

export const isMainDomain = () => {
  // Always treat native apps as tenant/storefront apps
  if (Capacitor.isNativePlatform()) {
      return false;
  }

  const hostname = window.location.hostname;
  
  // Check if it's exactly a main domain
  if (mainDomains.includes(hostname)) {
    return true;
  }

  // Check for local network IPs (192.168.x.x) - treat as main domain ONLY if it's the root IP
  // If we are accessing via nip.io or similar with subdomain, it is NOT a main domain
  if (hostname.startsWith('192.168.') && !hostname.includes('.nip.io')) {
    return true;
  }
  
  // Check for subdomain pattern of localhost
  if (hostname.includes('.localhost')) {
    return false;
  }
  
  // Check for subdomain of platform domains
  const isPlatformSubdomain = 
    hostname.endsWith(`.${platformDomain}`) || 
    hostname.endsWith(`.${secondaryDomain}`) || 
    hostname.endsWith('.saeaa.com') || 
    hostname.endsWith('.saeaa.net');

  if (isPlatformSubdomain && !mainDomains.includes(hostname)) {
    return false;
  }
  
  // Check for nip.io domains (local development with wildcards)
  if (hostname.includes('.nip.io')) {
    // If it has a subdomain part before the IP, it's a tenant domain
    // e.g. store.192.168.1.32.nip.io -> tenant
    // e.g. 192.168.1.32.nip.io -> main
    const parts = hostname.split('.');
    // IP.nip.io has 6 parts (4 for IP, 2 for nip.io)
    if (parts.length > 6) {
        return false;
    }
  }
  
  // Custom domains are always tenant domains
  if (!mainDomains.includes(hostname) && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
    return false;
  }
  
  return true;
};
