export const mainDomains = [
  'localhost', 
  '127.0.0.1', 
  'www.saeaa.com', 
  'saeaa.com', 
  'app.saeaa.com',
  'www.saeaa.net',
  'saeaa.net',
  'app.saeaa.net'
];

export const isMainDomain = () => {
  const hostname = window.location.hostname;
  
  // Check if it's exactly a main domain
  if (mainDomains.includes(hostname)) {
    return true;
  }
  
  // Check for subdomain pattern of localhost
  if (hostname.includes('.localhost')) {
    return false;
  }
  
  // Check for subdomain of saeaa.com or saeaa.net
  if ((hostname.endsWith('.saeaa.com') || hostname.endsWith('.saeaa.net')) && !mainDomains.includes(hostname)) {
    return false;
  }
  
  // Custom domains are always tenant domains
  if (!mainDomains.includes(hostname) && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return false;
  }
  
  return true;
};
