// Auth Types
import { DeviceFingerprint } from '@/lib/fingerprint';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  storeName?: string; // Optional - user will create store via setup page after signup
  nationalId: string; // Required - national ID or passport ID
  subdomain?: string; // Optional - removed from signup, user will select during store setup
  fingerprint?: DeviceFingerprint;
}

export interface LoginData {
  email?: string;
  username?: string;
  password: string;
  fingerprint?: DeviceFingerprint;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: string;
  tenantId?: string;
  createdAt?: string;
  isEmployee?: boolean;
  employerEmail?: string;
}

export interface KycData {
  businessName: string;
  businessType: string;
  taxId: string;
  address: string;
  documents: string[];
}

// Product Types
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  retailPrice?: number;
  wholesalePrice?: number;
  compareAtPrice?: number;
  costPerItem?: number;
  currency?: string;
  categoryId?: string;
  images?: ProductImage[];
  image?: string; // Single image fallback
  stock?: number;
  isActive: boolean;
  sku?: string;
  isAvailable?: boolean;
  variants?: ProductVariant[];
  tags?: string[];
  weight?: number;
  dimensions?: string;
  metaTitle?: string;
  metaDescription?: string;
  brandId?: string;
  brand?: Brand;
  isCardProduct?: boolean;
  productType?: string;
  type?: string;
  productCode?: string;
  min?: number;
  max?: number;
  enableSlider?: boolean;
  sliderStep?: number;
  sliderStepMode?: 'QUANTITY' | 'COINS' | 'PRICE';
  featuredPriceIncrease?: number;
  featuredPriceCurrency?: string;
  coinsNumber?: number;
}

export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  logo?: string;
  code?: string;
}

export interface CreateProductData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  categoryId?: string;
  images?: { url: string; altText?: string; sortOrder?: number }[];
  stock?: number;
  sku?: string;
  barcode?: string;
  isAvailable?: boolean;
  isPublished?: boolean;
  categoryIds?: string[];
  brandId?: string;
  variants?: CreateVariantData[];
  featured?: boolean;
  weight?: number;
  dimensions?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  image?: string;
  slug?: string;
  isActive?: boolean;
  productCount?: number;
}

export interface CreateCategoryData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductCollection {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  slug: string;
  isActive: boolean;
  products?: Product[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  sku?: string;
  attributes?: Record<string, string>;
}

export interface CreateVariantData {
  name: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  sku?: string;
  attributes?: Record<string, string>;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product?: Product;
  productVariant?: ProductVariant;
  unitPriceSnapshot?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  cartItems?: CartItem[];
  total: number;
  sessionId?: string;
}

export interface AddToCartData {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: string;
    name: string;
    images?: string[];
    price?: number;
    productCode?: string;
    nameAr?: string;
  };
  deliveries?: Array<{
    cardCode: string;
    cardPin?: string;
  }>;
}

// Order Types
export interface Order {
  id: string;
  userId?: string;
  orderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  isGuest?: boolean;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  items: OrderItem[];
  orderItems?: OrderItem[];
  total: number;
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  deliveryFiles?: {
    serialNumbers?: string[];
    serialNumbersByProduct?: Record<string, Array<{ serialNumber: string; pin?: string }>>;
    deliveryOptions?: string[];
    excelFileUrl?: string;
    textFileUrl?: string;
    pdfFileUrl?: string;
    error?: string;
    errorAr?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string; // Legacy support
  address1?: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string; // Legacy support
  zipCode?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  [key: string]: unknown;
}

export interface CreateOrderData {
  cartId?: string;
  items?: CartItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  shippingMethod?: string;
  useWalletBalance?: boolean;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  ipAddress?: string;
  contact?: {
    email: string;
    phone: string;
  };
  serialNumberDelivery?: string[];
}

// Theme Types
export interface Theme {
  id: string;
  name: string;
  version: string;
  description?: string;
  settings?: Record<string, unknown>; // Changed from config to match Prisma schema
  isActive: boolean;
}

export interface CreateThemeData {
  name: string;
  version: string;
  description?: string;
  config: Record<string, unknown>;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  minAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface CreateCouponData {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  minAmount?: number;
  maxUses?: number;
  expiresAt?: string;
}

// Page Types
export interface Page {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  slug: string;
  content: Record<string, unknown>;
  draftContent?: Record<string, unknown>;
  isPublished: boolean;
  seoTitle?: string;
  seoTitleAr?: string;
  seoTitleEn?: string;
  seoDescription?: string;  // Alias for seoDesc
  seoDesc?: string;
  seoDescAr?: string;
  seoDescEn?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface PageHistory {
  id: string;
  pageId: string;
  content: Record<string, unknown>;
  version: number;
  createdAt: string;
}

export interface CreatePageData {
  title: string;
  titleAr?: string;
  titleEn?: string;
  slug: string;
  content: Record<string, unknown>;
  draftContent?: Record<string, unknown>;
  isPublished?: boolean;
  seoTitle?: string;
  seoTitleAr?: string;
  seoTitleEn?: string;
  seoDescription?: string;  // Will be mapped to seoDesc on backend
  seoDescAr?: string;
  seoDescEn?: string;
}

// Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
}

export interface SalesReport {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductStats {
  productId: string;
  name: string;
  views: number;
  sales: number;
  revenue: number;
}

// Shipping Types
export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  methods: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  rate: number;
  cost?: number; // Added for compatibility
  estimatedDays?: number;
}

export interface CreateShippingZoneData {
  name: string;
  countries: string[];
  methods: ShippingMethod[];
}

// Tax Types
export interface TaxRate {
  id: string;
  country: string;
  state?: string;
  rate: number;
  isActive: boolean;
}

export interface CreateTaxRateData {
  country: string;
  state?: string;
  rate: number;
}

export interface TaxCalculationParams {
  amount: number;
  country: string;
  state?: string;
}

// Plugin Types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  config?: Record<string, unknown>;
}

// Site Config Types
export interface SiteSettings {
  storeName?: string;
  storeNameAr?: string;
  storeDescription?: string;
  storeDescriptionAr?: string;
  logoUrl?: string;
  storeLogoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  shippingEnabled?: boolean;
  inventoryTracking?: boolean;
  lowStockThreshold?: number;
  allowGuestCheckout?: boolean;
  requireEmailVerification?: boolean;
  maintenanceMode?: boolean;
  storeType?: 'GENERAL' | 'DIGITAL_CARDS';
  businessModel?: 'B2B' | 'B2C';
  customerRegistrationRequestEnabled?: boolean;
  paymentMethods?: string[];
  googlePlayUrl?: string;
  appStoreUrl?: string;
  blockVpnUsers?: boolean;
  isPrivateStore?: boolean;
  allowPublicLanding?: boolean;
  [key: string]: unknown;
}

export interface Link {
  id?: string;
  label?: string;
  labelAr?: string;
  url: string;
  [key: string]: unknown;
}

export interface SiteConfig {
  tenantId: string;
  header: { 
    title: string; 
    links: Link[]; 
    buttons?: (Link & { variant?: string })[];
    logo?: string;
  };
  footer: { links: Link[] };
  sidebar?: { links: Link[]; [key: string]: unknown };
  background: { type: string; value: string };
  language: string;
  theme: string;
  paymentMethods: string[];
  settings: SiteSettings;
  [key: string]: unknown;
}

// Query Params
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  categoryId?: string;
  brandId?: string;
  search?: string;
  market?: boolean;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  includeCategories?: boolean;
  includeBrand?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
}

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
}// Notification Types
export interface AppNotification {
  id: string;
  type: 'ORDER' | 'CUSTOMER' | 'INVENTORY' | 'MARKETING';
  titleEn: string;
  titleAr?: string;
  bodyEn: string;
  bodyAr?: string;
  data?: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  customerNotifications: boolean;
  inventoryNotifications: boolean;
  marketingNotifications: boolean;
  pushNotifications: boolean;
}
