// Utility to get the user's storefront URL based on their subdomain
export const getStorefrontUrl = (subdomain?: string): string => {
  if (!subdomain) {
    return '/'; // Fallback to home if no subdomain
  }

  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const protocol = window.location.protocol;

  // For local development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const portPart = currentPort ? `:${currentPort}` : '';
    return `${protocol}//${subdomain}.localhost${portPart}`;
  }

  // For production (saeaa.com or saeaa.net)
  if (currentHost.includes('saeaa.com')) {
    return `${protocol}//${subdomain}.saeaa.com`;
  }
  if (currentHost.includes('saeaa.net')) {
    return `${protocol}//${subdomain}.saeaa.net`;
  }

  // For custom domains, return the subdomain URL
  return `${protocol}//${subdomain}.localhost${currentPort ? `:${currentPort}` : ''}`;
};

// Get page URL on user's domain
export const getPageUrl = (slug: string, subdomain?: string): string => {
  const storefrontUrl = getStorefrontUrl(subdomain);
  return `${storefrontUrl}/${slug}`;
};
