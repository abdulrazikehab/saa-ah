// Utility to get the user's storefront URL based on their subdomain
export const getStorefrontUrl = (subdomain?: string): string => {
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const protocol = window.location.protocol;

  // If on main domain (saeaa.com), return main domain URL (not subdomain)
  if (currentHost === 'saeaa.com' || currentHost === 'www.saeaa.com') {
    return `${protocol}//saeaa.com`;
  }
  if (currentHost === 'saeaa.net' || currentHost === 'www.saeaa.net') {
    return `${protocol}//saeaa.net`;
  }

  if (!subdomain) {
    return '/'; // Fallback to home if no subdomain
  }

  // For local development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const portPart = currentPort ? `:${currentPort}` : '';
    return `${protocol}//${subdomain}.localhost${portPart}`;
  }

  // For production subdomains (e.g., market.saeaa.com) - check if it's actually a subdomain
  if (currentHost.endsWith('.saeaa.com') && currentHost !== 'saeaa.com' && currentHost !== 'www.saeaa.com') {
    return `${protocol}//${subdomain}.saeaa.com`;
  }
  if (currentHost.endsWith('.saeaa.net') && currentHost !== 'saeaa.net' && currentHost !== 'www.saeaa.net') {
    return `${protocol}//${subdomain}.saeaa.net`;
  }

  // Default fallback for production - use subdomain.saeaa.com format
  return `${protocol}//${subdomain}.saeaa.com`;
};

// Get page URL on user's domain
export const getPageUrl = (slug: string, subdomain?: string): string => {
  const storefrontUrl = getStorefrontUrl(subdomain);
  return `${storefrontUrl}/${slug}`;
};
