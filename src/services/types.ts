// Auth Types
import { DeviceFingerprint } from '@/lib/fingerprint';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  storeName: string; // Required - store name for automatic tenant creation
  nationalId: string; // Required - national ID or passport ID
  subdomain?: string; // Optional - will be auto-generated from storeName if not provided
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
  price: number;
  compareAtPrice?: number;
  categoryId?: string;
  images?: ProductImage[];
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
  description?: string;
  parentId?: string;
  image?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  slug?: string;
  parentId?: string;
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
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  sessionId?: string;
}

export interface AddToCartData {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  userId?: string;
  orderNumber?: string;
  items: CartItem[];
  orderItems?: Array<{
    id: string;
    quantity: number;
    price: number;
    product?: {
      name: string;
      images?: string[];
    };
  }>;
  total: number;
  totalAmount?: number;
  status: string;
  shippingAddress: Address;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  fullName?: string;
}

export interface CreateOrderData {
  items?: CartItem[];
  shippingAddress: Address;
  paymentMethod: string;
  shippingMethod?: string;
  contact?: {
    email: string;
    phone: string;
  };
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
  slug: string;
  content: Record<string, unknown>;
  draftContent?: Record<string, unknown>;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
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
  slug: string;
  content: Record<string, unknown>;
  draftContent?: Record<string, unknown>;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
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
  logoUrl?: string;
  currency?: string;
  language?: string;
  paymentMethods?: string[];
  [key: string]: unknown;
}

export interface Link {
  label: string;
  url: string;
  [key: string]: unknown;
}

export interface SiteConfig {
  tenantId: string;
  header: { title: string; links: Link[] };
  footer: { links: Link[] };
  background: { type: string; value: string };
  language: string;
  theme: string;
  paymentMethods: string[];
  settings: SiteSettings;
}

// Query Params
export interface ProductQueryParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  search?: string;
  market?: boolean;
}

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
}
