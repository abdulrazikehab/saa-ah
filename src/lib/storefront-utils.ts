// Utility to get the user's storefront URL based on their subdomain
export const getStorefrontUrl = (subdomain?: string): string => {
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const protocol = window.location.protocol;
  const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
  const secondaryDomain = import.meta.env.VITE_PLATFORM_SECONDARY_DOMAIN || 'saeaa.net';

  // If on main domain, return main domain URL (not subdomain)
  if (currentHost === platformDomain || currentHost === `www.${platformDomain}`) {
    return `${protocol}//${platformDomain}`;
  }
  if (currentHost === secondaryDomain || currentHost === `www.${secondaryDomain}`) {
    return `${protocol}//${secondaryDomain}`;
  }
  if (currentHost === 'kawn.com' || currentHost === 'www.kawn.com') {
    return `${protocol}//kawn.com`;
  }
  if (currentHost === 'kawn.net' || currentHost === 'www.kawn.net') {
    return `${protocol}//kawn.net`;
  }

  if (!subdomain) {
    return '/'; // Fallback to home if no subdomain
  }

  // For local development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const portPart = currentPort ? `:${currentPort}` : '';
    return `${protocol}//${subdomain}.localhost${portPart}`;
  }

  // Check for subdomains of configured domains
  if (currentHost.endsWith(`.${platformDomain}`) && currentHost !== platformDomain && currentHost !== `www.${platformDomain}`) {
    return `${protocol}//${subdomain}.${platformDomain}`;
  }
  if (currentHost.endsWith(`.${secondaryDomain}`) && currentHost !== secondaryDomain && currentHost !== `www.${secondaryDomain}`) {
    return `${protocol}//${subdomain}.${secondaryDomain}`;
  }

  // Legacy Check for production subdomains (e.g., market.kawn.com)
  if (currentHost.endsWith('.kawn.com') && currentHost !== 'kawn.com' && currentHost !== 'www.kawn.com') {
    return `${protocol}//${subdomain}.kawn.com`;
  }
  if (currentHost.endsWith('.kawn.net') && currentHost !== 'kawn.net' && currentHost !== 'www.kawn.net') {
    return `${protocol}//${subdomain}.kawn.net`;
  }

  // Default fallback for production - use the configured platform domain
  return `${protocol}//${subdomain}.${platformDomain}`;
};

// Get page URL on user's domain
export const getPageUrl = (slug: string, subdomain?: string): string => {
  const storefrontUrl = getStorefrontUrl(subdomain);
  return `${storefrontUrl}/${slug}`;
};

/**
 * Get tenant context from current hostname
 * Returns the tenant subdomain/domain for use in API calls
 * This ensures customer signup/login works with the correct merchant's table
 */
export const getTenantContext = (): { domain: string; subdomain?: string } => {
  const hostname = window.location.hostname;
  const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
  const secondaryDomain = import.meta.env.VITE_PLATFORM_SECONDARY_DOMAIN || 'saeaa.net';
  
  // For localhost with subdomain (e.g., market.localhost)
  if (hostname.includes('.localhost')) {
    const subdomain = hostname.split('.localhost')[0];
    if (subdomain !== 'www' && subdomain !== 'admin') {
      return { domain: `${subdomain}.${platformDomain}`, subdomain };
    }
  }
  
  // For production subdomains of platform domains
  const platformDomains = [platformDomain, secondaryDomain, 'kawn.com', 'kawn.net'];
  for (const pDomain of platformDomains) {
    if (hostname.endsWith(`.${pDomain}`) && hostname !== pDomain && hostname !== `www.${pDomain}`) {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'app') {
          return { domain: hostname, subdomain };
        }
      }
    }
  }
  
  // For main domains or localhost without subdomain, try to get from localStorage
  try {
    const storefrontSubdomain = localStorage.getItem('storefrontTenantSubdomain');
    if (storefrontSubdomain) {
      return { domain: hostname, subdomain: storefrontSubdomain };
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as { tenantSubdomain?: string; tenantId?: string };
      if (parsed.tenantSubdomain) {
        return { domain: hostname, subdomain: parsed.tenantSubdomain };
      }
    }
  } catch {
    // Ignore errors
  }
  
  // Fallback to hostname
  return { domain: hostname };
};

export const getMobileTenantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  const paramTenantId = urlParams.get('tenantId');
  const storedId = localStorage.getItem('storefrontTenantId') || sessionStorage.getItem('storefrontTenantId');
  const id = paramTenantId || storedId;
  if (paramTenantId) {
    localStorage.setItem('storefrontTenantId', paramTenantId);
    sessionStorage.setItem('storefrontTenantId', paramTenantId);
  }
  if (!id && window.location.hostname.includes('nip.io')) {
    return 'c692ca44-bcea-4963-bb47-73957dd8b929';
  }
  return id;
};