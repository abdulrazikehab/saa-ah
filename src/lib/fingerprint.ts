
export interface FingerprintComponents {
  userAgent: string;
  language: string;
  screenResolution: string;
  timezone: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  webglRenderer: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  canvasHash: string;
}

export interface DeviceFingerprint {
  visitorId: string;
  components: FingerprintComponents;
  isVM: boolean;
  isVpn: boolean;
  os: string;
  riskScore: number;
}

async function getCanvasHash(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    // Text with special characters to test rendering
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello World! <@>', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Hello World! <@>', 4, 17);
    
    return canvas.toDataURL();
  } catch (e) {
    return '';
  }
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    // @ts-ignore
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    // @ts-ignore
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  } catch (e) {
    return '';
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function getDeviceFingerprint(): Promise<DeviceFingerprint> {
  const components: FingerprintComponents = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    // @ts-ignore
    deviceMemory: navigator.deviceMemory || 0,
    webglRenderer: getWebGLRenderer(),
    cookiesEnabled: navigator.cookieEnabled,
    localStorageEnabled: !!window.localStorage,
    canvasHash: await getCanvasHash(),
  };

  // Create a stable string from components to hash
  const componentsString = JSON.stringify(components);
  const visitorId = simpleHash(componentsString);

  // VM Detection Heuristics
  const vmRenderers = ['SwiftShader', 'llvmpipe', 'VMware', 'VirtualBox', 'Software Adapter', 'Microsoft Basic Render Driver'];
  const isVM = vmRenderers.some(r => components.webglRenderer.includes(r)) || 
               components.screenResolution === '800x600' || // Common default VM resolution
               components.screenResolution === '1024x768';

  // Basic OS Detection
  let os = 'Unknown';
  if (navigator.userAgent.indexOf('Win') !== -1) os = 'Windows';
  if (navigator.userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  if (navigator.userAgent.indexOf('Linux') !== -1) os = 'Linux';
  if (navigator.userAgent.indexOf('Android') !== -1) os = 'Android';
  if (navigator.userAgent.indexOf('like Mac') !== -1) os = 'iOS';

  // Basic VPN/Proxy Detection Heuristics
  // 1. Timezone mismatch (simple check)
  const timezone = components.timezone;
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset(); // in minutes
  
  // This is a very basic heuristic. Real VPN detection requires server-side IP analysis.
  // We'll mark it as suspicious if timezone is 'UTC' but offset is not 0, or similar anomalies.
  let isVpn = false;
  if (timezone === 'UTC' && timezoneOffset !== 0) isVpn = true;
  
  // 2. Check for common privacy/anonymity tools in User Agent
  if (navigator.userAgent.includes('Tor')) isVpn = true;

  // Calculate initial risk score (0-100)
  let riskScore = 0;
  if (isVM) riskScore += 50;
  if (isVpn) riskScore += 30;
  if (!components.cookiesEnabled) riskScore += 10;
  if (!components.localStorageEnabled) riskScore += 10;
  if (components.userAgent.includes('Headless')) riskScore += 80;

  return {
    visitorId,
    components,
    isVM,
    isVpn,
    os,
    riskScore
  };
}
