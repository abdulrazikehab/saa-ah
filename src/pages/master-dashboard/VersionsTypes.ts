// Define available tabs for the System Admin Panel
export const AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'overview', label: 'Overview', icon: 'Activity' },
  { id: 'tenants', label: 'Tenants', icon: 'Building2' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'customers', label: 'Customers', icon: 'UserPlus' },
  { id: 'plans', label: 'Plans', icon: 'CreditCard' },
  { id: 'features', label: 'Features', icon: 'Zap' },
  { id: 'versions', label: 'Versions', icon: 'Layers' },
  { id: 'gifts', label: 'Gifts', icon: 'Gift' },
  { id: 'gateways', label: 'Gateways', icon: 'Handshake' },
  { id: 'partners', label: 'Partners', icon: 'Handshake' },
  { id: 'transactions', label: 'Transactions', icon: 'DollarSign' },
  { id: 'logs', label: 'Security Logs', icon: 'Shield' },
  { id: 'database', label: 'Database', icon: 'Database' },
  { id: 'permissions', label: 'Permissions', icon: 'Lock' },
  { id: 'api-keys', label: 'API Keys', icon: 'Key' },
  { id: 'pages', label: 'Pages', icon: 'FileText' },
  { id: 'limits', label: 'Limits', icon: 'Ban' },
  { id: 'ai', label: 'AI Settings', icon: 'Bot' },
  { id: 'cloudinary', label: 'Cloudinary', icon: 'Cloud' },
  { id: 'supplier-products', label: 'Supplier Products', icon: 'Building2' },
  { id: 'complaints', label: 'Complaints', icon: 'MessageSquare' },
  { id: 'platform-settings', label: 'Platform Settings', icon: 'Settings' },
];

// Define available tabs for the Tenant Dashboard (User Side)
export const AVAILABLE_TENANT_TABS = [
  // Home
  { id: 'dashboard', label: 'Dashboard', section: 'Home' },
  
  // Sales & Orders
  { id: 'hierarchical', label: 'Products & Groups', section: 'Sales & Orders' },
  { id: 'products', label: 'Products', section: 'Sales & Orders' },
  { id: 'categories', label: 'Categories', section: 'Sales & Orders' },
  { id: 'brands', label: 'Brands', section: 'Sales & Orders' },
  { id: 'prices', label: 'Price Management', section: 'Sales & Orders' },
  { id: 'orders', label: 'Orders', section: 'Sales & Orders' },
  { id: 'inventory', label: 'Inventory', section: 'Sales & Orders' },
  { id: 'banks', label: 'Banks & Transactions', section: 'Sales & Orders' },
  { id: 'supplier-products', label: 'Supplier Products', section: 'Sales & Orders' },
  { id: 'customers', label: 'Customers', section: 'Sales & Orders' },

  // Reports
  { id: 'reports', label: 'General Reports', section: 'Reports' },
  { id: 'customer-reports', label: 'Customer Reports', section: 'Reports' },
  { id: 'customer-balances', label: 'Customer Balances', section: 'Reports' },
  { id: 'product-reports', label: 'Product Reports', section: 'Reports' },
  { id: 'payment-reports', label: 'Payment Reports', section: 'Reports' },

  // Content & Design
  { id: 'pages', label: 'Pages', section: 'Content & Design' },
  { id: 'storefront', label: 'Storefront', section: 'Content & Design' },
  { id: 'templates', label: 'Templates', section: 'Content & Design' },

  // Marketing
  { id: 'marketing', label: 'Marketing', section: 'Marketing' },
  { id: 'smart-line', label: 'Smart Line (AI)', section: 'Marketing' },

  // Store Settings
  { id: 'settings', label: 'General Settings', section: 'Store Settings' },
  { id: 'notifications', label: 'Notifications', section: 'Store Settings' },
  { id: 'payment', label: 'Payment', section: 'Store Settings' },
  { id: 'checkout', label: 'Checkout', section: 'Store Settings' },
  { id: 'limits', label: 'Limits', section: 'Store Settings' },
  { id: 'domains', label: 'Domains', section: 'Store Settings' },
  { id: 'suppliers', label: 'Suppliers', section: 'Store Settings' },
  { id: 'units', label: 'Units', section: 'Store Settings' },
  { id: 'currencies', label: 'Currencies', section: 'Store Settings' },

  // Advanced
  { id: 'users', label: 'Users', section: 'Advanced' },
  { id: 'employees', label: 'Employees', section: 'Advanced' },
  { id: 'permissions', label: 'Permissions', section: 'Advanced' },
  { id: 'integrations', label: 'Integrations', section: 'Advanced' },
  { id: 'kyc', label: 'Identity Verification', section: 'Advanced' },
  { id: 'apps', label: 'App Store', section: 'Advanced' },
  { id: 'management', label: 'Store Management', section: 'Advanced' },
  { id: 'chat', label: 'Chat', section: 'Advanced' },
];


export interface SystemVersion {
  id: string;
  name: string;
  description: string;
  versionCode: string; // e.g., 'v1', 'v2', 'enterprise'
  
  // Controls System Admin Panel
  visibleTabs: string[];
  
  // Controls Tenant/User Dashboard
  visibleTenantTabs: string[];
  
  enabledFeatures: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export const AVAILABLE_FEATURES = [
  { id: 'page_builder', label: 'Page Builder', category: 'core', description: 'Drag and drop page builder' },
  { id: 'ai_assistant', label: 'AI Assistant', category: 'core', description: 'AI-powered content generation' },
  { id: 'chat_support', label: 'Live Chat Support', category: 'support', description: 'Real-time chat with customers' },
  { id: 'analytics_advanced', label: 'Advanced Analytics', category: 'analytics', description: 'Detailed insights and reports' },
  { id: 'custom_domain', label: 'Custom Domain', category: 'core', description: 'Use your own domain name' },
  { id: 'api_access', label: 'API Access', category: 'integration', description: 'REST API for integrations' },
  { id: 'email_marketing', label: 'Email Marketing', category: 'marketing', description: 'Send promotional emails' },
  { id: 'seo_tools', label: 'SEO Tools', category: 'marketing', description: 'Basic SEO optimization' },
  { id: 'multiple_staff', label: 'Team Members', category: 'core', description: 'Add multiple staff accounts' },
  { id: 'white_label', label: 'White Label', category: 'design', description: 'Remove platform branding' },
  { id: 'webhooks', label: 'Webhooks', category: 'integration', description: 'Real-time event notifications' },
  { id: 'priority_support', label: 'Priority Support', category: 'support', description: '24/7 priority assistance' },
];
