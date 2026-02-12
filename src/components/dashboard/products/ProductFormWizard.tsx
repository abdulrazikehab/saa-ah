import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Check, Upload, X, 
  Image as ImageIcon, Cloud, Package, Tag, DollarSign, 
  Settings, Globe, AlertCircle, Trash2, Info,
  ArrowRight, ShoppingBag, CreditCard, Zap, Play,
  Coins, Target
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { validateImageSignature } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CurrencyIcon } from '@/components/currency/CurrencyIcon';
import { CloudinaryImagePicker } from '@/components/dashboard/CloudinaryImagePicker';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

// Interfaces
interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
}

interface Unit {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  cost: number;
}

interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  discountRate: number;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  exchangeRate: number;
  isDefault?: boolean;
}

export interface ProductSupplierFormData {
  supplierId: string;
  price: string; // Supplier price for this product
  discountRate?: number;
  isPrimary?: boolean;
  supplierProductCode?: string;
}

export interface ProductFormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  sku: string;
  barcode: string;
  stock: string;
  lowStockThreshold: string;
  categoryId: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  featured: boolean;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  weight: string;
  dimensions: string;
  unitId: string;
  productCode: string;
  odooProductId: string;
  path: string;
  categoryIds: string[];
  brandId: string;
  supplierIds: string[]; // Legacy support
  suppliers: ProductSupplierFormData[]; // New: suppliers with prices
  minQuantity: string;
  maxQuantity: string;
  enableSlider: boolean;
  sliderStep: string;
  sliderStepMode: 'QUANTITY' | 'COINS' | 'PRICE';
  pricePerUnit: string;
  coinsPerUnit: string;
  priceCurrency: string;
  costCurrency: string;
  displayCurrency: string;
  // Featured product settings
  featuredStartDate: string;
  featuredEndDate: string;
  featuredPriceIncrease: string;
  featuredPriceCurrency: string;
}

interface ProductFormWizardProps {
  initialData?: Partial<ProductFormData>;
  initialImages?: string[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  suppliers: Supplier[];
  currencies: Currency[];
  onSave: (data: ProductFormData, images: string[]) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}



export function ProductFormWizard({
  initialData = {},
  initialImages = [],
  categories,
  brands,
  units,
  suppliers,
  currencies = [],
  onSave,
  onCancel,
  isEditing = false
}: ProductFormWizardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [productImages, setProductImages] = useState<string[]>(initialImages);
  
  // Slider Preview State
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [testValue, setTestValue] = useState(1);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    sku: '',
    barcode: '',
    stock: '',
    lowStockThreshold: '10',
    categoryId: '',
    status: 'ACTIVE',
    featured: false,
    tags: '',
    metaTitle: '',
    metaDescription: '',
    weight: '',
    dimensions: '',
    unitId: '',
    productCode: '',
    odooProductId: '',
    path: '',
    categoryIds: [],
    brandId: '',
    supplierIds: [],
    suppliers: [],
    minQuantity: '',
    maxQuantity: '',
    enableSlider: false,
    sliderStep: '1',
    sliderStepMode: 'QUANTITY',
    pricePerUnit: '',
    coinsPerUnit: '',
    priceCurrency: 'SAR',
    costCurrency: 'SAR',
    displayCurrency: 'SAR',
    featuredStartDate: '',
    featuredEndDate: '',
    featuredPriceIncrease: '',
    featuredPriceCurrency: 'SAR',
    ...initialData
  });

  // Calculate best supplier price and auto-fill cost
  useEffect(() => {
    if (formData.suppliers && formData.suppliers.length > 0) {
      const prices = formData.suppliers
        .map(s => parseFloat(s.price))
        .filter(p => !isNaN(p) && p > 0);
      
      if (prices.length > 0) {
        const bestPrice = Math.min(...prices);
        setFormData(prev => ({ ...prev, cost: bestPrice.toFixed(2) }));
      }
    }
  }, [formData.suppliers]);

  // Auto-generate path from name
  const prevNameRef = useRef(formData.name);
  useEffect(() => {
    if (formData.name !== prevNameRef.current) {
      const nameChanged = formData.name !== prevNameRef.current;
      
      // Check if the current path is either empty or matches the auto-generated pattern from the previous name
      // We also check if it starts with a category path prefix (ends with a hyphen)
      const isAutoGenerated = !formData.path || 
        formData.path === prevNameRef.current.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '') ||
        (formData.path.endsWith('-') && !formData.path.includes(prevNameRef.current.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')));

      if (nameChanged && isAutoGenerated) {
        const nameSlug = formData.name
          .toLowerCase()
          .trim()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // If the path already has a prefix (e.g. from categories), preserve it
        const currentPath = formData.path || '';
        const hasPrefix = currentPath.includes('-') && !currentPath.startsWith(prevNameRef.current.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, ''));
        
        if (hasPrefix) {
          // Find the last hyphen that isn't part of the name slug
          const lastHyphenIndex = currentPath.lastIndexOf('-');
          const prefix = currentPath.substring(0, lastHyphenIndex + 1);
          setFormData(prev => ({ ...prev, path: prefix + nameSlug }));
        } else {
          setFormData(prev => ({ ...prev, path: nameSlug }));
        }
      }
      prevNameRef.current = formData.name;
    }
  }, [formData.name, formData.path]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Security Check
    for (const file of Array.from(files)) {
      const { isValid, reason } = await validateImageSignature(file);
      if (!isValid) {
        toast({
          title: 'ملف غير آمن',
          description: `تم رفض الملف ${file.name}: ${reason}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadFormData.append('images', files[i]);
      }

      const res = await coreApi.post('/upload/product-images', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        requireAuth: true
      }) as { images?: Array<{ secureUrl?: string; url?: string }> };

      if (res.images && res.images.length > 0) {
        const newImageUrls = res.images.map((img) => img.secureUrl || img.url || '');
        setProductImages(prev => [...prev, ...newImageUrls]);
        toast({ title: 'تم الرفع بنجاح', description: 'تم رفع الصور بنجاح' });
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast({
        title: 'تعذر رفع الصور',
        description: 'حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!formData.name?.trim()) {
      toast({ title: 'حقل مطلوب', description: 'اسم المنتج مطلوب', variant: 'destructive' });
      return;
    }
    if (!formData.price?.trim()) {
      toast({ title: 'حقل مطلوب', description: 'سعر المنتج مطلوب', variant: 'destructive' });
      return;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast({ title: 'خطأ في السعر', description: 'السعر يجب أن يكون رقماً صحيحاً', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData, productImages);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ المنتج',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-1 py-2 min-h-0">
        <div className="space-y-8 pb-12">
          {/* SECTION 1: BASIC DETAILS & MEDIA */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('dashboard.products.form.basicInfo')}
              </h3>
              
              {/* 1. Image Upload (Top, Full Width) */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">{t('dashboard.products.form.media')}</Label>
                <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mb-4">
                    {productImages.map((image, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-md border shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-0.5 right-0.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setProductImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                         onClick={() => document.getElementById('wizard-image-upload')?.click()}>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground text-center px-1">
                        {t('dashboard.products.form.uploadImages', 'رفع')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      id="wizard-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('wizard-image-upload')?.click()}
                      disabled={uploadingImage}
                      className="flex-1"
                    >
                      <ImageIcon className="ml-2 h-4 w-4" />
                      {uploadingImage 
                        ? t('dashboard.products.form.saving', 'جاري الحفظ...') 
                        : t('dashboard.products.form.orClickToUpload', 'أو انقر للرفع')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCloudinaryPicker(true)}
                      className="flex-1"
                    >
                      <Cloud className="ml-2 h-4 w-4" />
                      {t('dashboard.products.form.browseCloudinary', 'تصفح المكتبة')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 2. Name (English) */}
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنتج (English) <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('dashboard.products.form.name')}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              {/* 3. Name (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t('dashboard.products.form.nameAr')}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder={t('dashboard.products.form.nameAr')}
                  className="text-right"
                  dir="rtl"
                />
              </div>

              {/* 4. SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">{t('dashboard.products.form.sku')}</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>

              {/* 4.5. Product Code */}
              <div className="space-y-2">
                <Label htmlFor="productCode">{t('dashboard.products.form.productCode', 'Product Code')}</Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  placeholder={t('dashboard.products.form.productCodePlaceholder', 'Enter product code')}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              {/* 5. Category */}
              <div className="space-y-2">
                <Label>{t('dashboard.products.form.categories')}</Label>
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value && !formData.categoryIds.includes(value)) {
                      setFormData({ ...formData, categoryIds: [...formData.categoryIds, value] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.products.form.selectCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => !formData.categoryIds.includes(cat.id)).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nameAr || category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.categoryIds.map((catId) => {
                    const category = categories.find(c => c.id === catId);
                    return category ? (
                      <Badge key={catId} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                        {category.nameAr || category.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== catId) })}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* 6. Path */}
              <div className="space-y-2">
                <Label htmlFor="path">{t('dashboard.products.form.path')}</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder={t('dashboard.products.form.pathPlaceholder')}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              {/* 7. Description (English) */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('dashboard.products.form.description')}</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder={t('dashboard.products.form.description')}
                  dir="ltr"
                />
              </div>

              {/* 8. Description (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t('dashboard.products.form.descriptionAr')}</Label>
                <RichTextEditor
                  value={formData.descriptionAr}
                  onChange={(val) => setFormData({ ...formData, descriptionAr: val })}
                  placeholder={t('dashboard.products.form.descriptionAr')}
                  dir="rtl"
                />
              </div>

              {/* Other Organization Fields (Tags, Codes) - Grouped nicely */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="tags">{t('dashboard.products.form.tags')}</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder={t('dashboard.products.form.tagsPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odooProductId">{t('dashboard.products.form.odooId')}</Label>
                  <Input
                    id="odooProductId"
                    value={formData.odooProductId}
                    onChange={(e) => setFormData({ ...formData, odooProductId: e.target.value })}
                    placeholder={t('dashboard.products.form.optional')}
                  />
                </div>
              </div>
            </div>


          {/* SECTION 2: PRICING & INVENTORY */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('dashboard.products.form.pricingInventory')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> {t('dashboard.products.form.pricing')}
                  </h3>
                  {/* Price with Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('dashboard.products.form.price')} <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        className="text-lg font-medium flex-1"
                      />
                      <Select
                        value={formData.priceCurrency}
                        onValueChange={(value) => setFormData({ ...formData, priceCurrency: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="SAR" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.code}>
                              <div className="flex items-center gap-2">
                                <CurrencyIcon currencyCode={currency.code} size={16} />
                                <span>{currency.code} ({currency.symbol})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.priceCurrency !== 'SAR' && currencies.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {((parseFloat(formData.price) || 0) * (currencies.find(c => c.code === formData.priceCurrency)?.exchangeRate || 1)).toFixed(2)} SAR
                      </p>
                    )}
                  </div>
                  {/* Compare At Price */}
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">{t('dashboard.products.form.compareAtPrice')}</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  {/* Cost with Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="cost">
                      {t('dashboard.products.form.cost')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        disabled={formData.suppliers.length > 0}
                        className={cn("flex-1", formData.suppliers.length > 0 ? "bg-muted cursor-not-allowed" : "")}
                      />
                      <Select
                        value={formData.costCurrency}
                        onValueChange={(value) => setFormData({ ...formData, costCurrency: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="SAR" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.code}>
                              <div className="flex items-center gap-2">
                                <CurrencyIcon currencyCode={currency.code} size={16} />
                                <span>{currency.code} ({currency.symbol})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.costCurrency !== 'SAR' && currencies.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {((parseFloat(formData.cost) || 0) * (currencies.find(c => c.code === formData.costCurrency)?.exchangeRate || 1)).toFixed(2)} SAR
                      </p>
                    )}
                  </div>
                  {/* Display Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="displayCurrency">{t('dashboard.products.form.displayCurrency', 'عملة العرض')}</Label>
                    <Select
                      value={formData.displayCurrency}
                      onValueChange={(value) => setFormData({ ...formData, displayCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="SAR" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currencyCode={currency.code} size={16} />
                              <span>{currency.nameAr || currency.name} ({currency.code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" /> {t('dashboard.products.form.inventory')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="barcode">{t('dashboard.products.form.barcode')}</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t('dashboard.products.form.quantity')}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">{t('dashboard.products.form.lowStockThreshold')}</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('dashboard.products.form.advanced', 'الموردين والمواصفات')}</Label>
                <div className="space-y-2">
                  <Label htmlFor="unitId">{t('dashboard.products.form.unit')}</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('dashboard.products.form.selectUnit')} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nameAr || unit.name} ({unit.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">{t('dashboard.products.form.weight')}</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">{t('dashboard.products.form.dimensions')}</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder={t('dashboard.products.form.dimensionsPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('dashboard.products.form.suppliers', 'إدارة الموردين')}</Label>
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value) {
                      console.log('Selecting supplier:', value);
                      const supplier = suppliers.find(s => s.id === value);
                      if (supplier) {
                        console.log('Found supplier:', supplier);
                        if (!formData.suppliers.some(s => s.supplierId === value)) {
                          const newSuppliers = [...formData.suppliers, {
                            supplierId: value,
                            price: '',
                            discountRate: supplier.discountRate,
                            isPrimary: formData.suppliers.length === 0,
                            supplierProductCode: ''
                          }];
                          console.log('Updating suppliers list:', newSuppliers);
                          setFormData({ 
                            ...formData, 
                            suppliers: newSuppliers
                          });
                        } else {
                          console.warn('Supplier already added:', value);
                        }
                      } else {
                        console.error('Supplier not found in list:', value);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.products.form.addSupplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(sup => !formData.suppliers.some(s => s.supplierId === sup.id)).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nameAr || supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                  {formData.suppliers.map((supplierForm, index) => {
                    const supplier = suppliers.find(s => s.id === supplierForm.supplierId);
                    
                    if (!supplier) {
                      return (
                        <div key={supplierForm.supplierId} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 gap-2">
                           <div className="flex-1">
                             <p className="text-sm font-medium text-destructive">
                               {t('dashboard.products.form.unknownSupplier', 'مورد غير معروف')} ({supplierForm.supplierId})
                             </p>
                           </div>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-8 w-8 text-destructive"
                             onClick={() => setFormData({ ...formData, suppliers: formData.suppliers.filter((_, i) => i !== index) })}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                        </div>
                      );
                    }

                    return (
                      <div key={supplierForm.supplierId} className="flex items-start justify-between p-3 border rounded-lg bg-muted/30 gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{supplier.nameAr || supplier.name}</p>
                            {supplierForm.isPrimary && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{t('dashboard.products.form.setAsPrimary', 'أساسي')}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{t('dashboard.products.form.price', 'السعر')}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={supplierForm.price}
                                onChange={(e) => {
                                  const updated = [...formData.suppliers];
                                  updated[index].price = e.target.value;
                                  setFormData({ ...formData, suppliers: updated });
                                }}
                                placeholder="0.00"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{t('dashboard.products.form.discountRate', 'نسبة الخصم %')}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={supplierForm.discountRate || supplier.discountRate || ''}
                                onChange={(e) => {
                                  const updated = [...formData.suppliers];
                                  updated[index].discountRate = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, suppliers: updated });
                                }}
                                placeholder="0"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{t('dashboard.products.form.product_code', 'كود المنتج عند المورد')}</Label>
                              <Input
                                value={supplierForm.supplierProductCode || ''}
                                onChange={(e) => {
                                  const updated = [...formData.suppliers];
                                  updated[index].supplierProductCode = e.target.value;
                                  setFormData({ ...formData, suppliers: updated });
                                }}
                                placeholder={t('dashboard.products.form.product_code_placeholder', 'مثال: STEAM-10')}
                                className="h-8 text-xs"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`primary-${supplierForm.supplierId}`}
                              checked={supplierForm.isPrimary || false}
                              onCheckedChange={(checked) => {
                                const updated = formData.suppliers.map((s, i) => ({
                                  ...s,
                                  isPrimary: i === index ? (checked === true) : false
                                }));
                                setFormData({ ...formData, suppliers: updated });
                              }}
                            />
                            <Label htmlFor={`primary-${supplierForm.supplierId}`} className="text-xs cursor-pointer">
                              {t('dashboard.products.form.setAsPrimary', 'تعيين كمورد أساسي')}
                            </Label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive flex-shrink-0"
                          onClick={() => setFormData({ ...formData, suppliers: formData.suppliers.filter((_, i) => i !== index) })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity Slider Settings */}
            <Card className={cn("border-dashed", formData.enableSlider ? "bg-primary/5 border-primary/30" : "bg-muted/20")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="enableSlider" className="font-semibold">{t('dashboard.products.form.quantitySlider')}</Label>
                      {formData.enableSlider && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          {t('dashboard.products.form.freeProduct', 'منتج حر')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.enableSlider 
                        ? t('dashboard.products.form.freeProductDesc', 'يمكن للعميل اختيار أي مبلغ ضمن الحدود المحددة')
                        : t('dashboard.products.form.quantitySliderDesc')}
                    </p>
                  </div>
                  <Switch
                    id="enableSlider"
                    checked={formData.enableSlider}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableSlider: checked })}
                  />
                </div>
                
                {formData.enableSlider && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minQuantity">{t('dashboard.products.form.minQuantity')}</Label>
                        <Input
                          id="minQuantity"
                          type="number"
                          min="1"
                          value={formData.minQuantity}
                          onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxQuantity">{t('dashboard.products.form.maxQuantity')}</Label>
                        <Input
                          id="maxQuantity"
                          type="number"
                          min="1"
                          value={formData.maxQuantity}
                          onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                    </div>

                    {/* Increment Mode Selection */}
                    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          {t('dashboard.products.form.stepMode', 'طريقة حساب الزيادة')}
                        </Label>
                        <Tabs 
                          value={formData.sliderStepMode} 
                          onValueChange={(val) => setFormData({ ...formData, sliderStepMode: val as 'QUANTITY' | 'COINS' | 'PRICE' })}
                          className="w-auto"
                        >
                          <TabsList className="grid grid-cols-3 h-9 w-[300px]">
                            <TabsTrigger value="QUANTITY" className="text-xs">{t('dashboard.products.form.stepModeQuantity', 'الكمية')}</TabsTrigger>
                            <TabsTrigger value="COINS" className="text-xs">{t('dashboard.products.form.stepModeCoins', 'الكوينز')}</TabsTrigger>
                            <TabsTrigger value="PRICE" className="text-xs">{t('dashboard.products.form.stepModePrice', 'السعر')}</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="grid grid-cols-1 gap-4 pt-2">
                        {formData.sliderStepMode === 'QUANTITY' && (
                          <div className="space-y-2">
                            <Label htmlFor="sliderStep" className="text-xs font-bold text-muted-foreground uppercase">{t('dashboard.products.form.quantityIncrease', 'زيادة الكمية')}</Label>
                            <div className="relative">
                              <Input
                                id="sliderStep"
                                type="number"
                                min="1"
                                value={formData.sliderStep}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const pricePerUnit = parseFloat(formData.price) || 0;
                                  const coinsPerUnitVal = parseFloat(formData.coinsPerUnit) || 0;
                                  setFormData({ 
                                    ...formData, 
                                    sliderStep: val,
                                    featuredPriceIncrease: (parseFloat(val) * pricePerUnit).toFixed(2),
                                  });
                                }}
                                placeholder="1"
                                className="pl-12"
                              />
                              <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {t('dashboard.products.form.stepHintQuant', 'سيتم تحريك الشريط بمضاعفات هذا الرقم')}
                            </p>
                          </div>
                        )}

                        {formData.sliderStepMode === 'COINS' && (
                          <div className="space-y-2">
                            <Label htmlFor="coinsPerUnit" className="text-xs font-bold text-muted-foreground uppercase">{t('dashboard.products.form.coinsIncrease', 'زيادة الكوينز')}</Label>
                            <div className="relative">
                              <Input
                                id="coinsPerUnit"
                                type="number"
                                min="1"
                                value={formData.coinsPerUnit}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // logic if needed to link to quant
                                  setFormData({ ...formData, coinsPerUnit: val });
                                }}
                                placeholder="0"
                                className="pl-12"
                              />
                              <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {t('dashboard.products.form.stepHintCoins', 'سيتم زيادة الرصيد بهذا الرقم لكل خطوة')}
                            </p>
                          </div>
                        )}

                        {formData.sliderStepMode === 'PRICE' && (
                          <div className="space-y-2">
                            <Label htmlFor="featuredPriceIncrease" className="text-xs font-bold text-muted-foreground uppercase">{t('dashboard.products.form.priceIncrease', 'زيادة السعر')}</Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  id="featuredPriceIncrease"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.featuredPriceIncrease}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const pricePerUnit = parseFloat(formData.price) || 0;
                                    if (pricePerUnit > 0) {
                                      const calculatedStep = (parseFloat(val) / pricePerUnit);
                                      setFormData({ 
                                        ...formData, 
                                        featuredPriceIncrease: val,
                                        sliderStep: calculatedStep >= 1 ? calculatedStep.toFixed(0) : "1"
                                      });
                                    } else {
                                      setFormData({ ...formData, featuredPriceIncrease: val });
                                    }
                                  }}
                                  placeholder="0.00"
                                />
                                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                              </div>
                              <Select
                                value={formData.featuredPriceCurrency}
                                onValueChange={(value) => setFormData({ ...formData, featuredPriceCurrency: value })}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="SAR" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={currency.code}>
                                      {currency.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {t('dashboard.products.form.stepHintPrice', 'سيتم احتساب قيم الكمية بناءً على هذا السعر')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="pt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-12 border-primary/20 hover:bg-primary/5 text-primary gap-2"
                        onClick={() => {
                          setTestValue(parseInt(formData.minQuantity) || 1);
                          setIsPreviewDialogOpen(true);
                        }}
                      >
                        <Play className="w-4 h-4" />
                        {t('dashboard.products.form.testSlider', 'اختبار الشريط (Slider)')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION 3: SEO & SETTINGS */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('dashboard.products.form.seoSettings')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {t('dashboard.products.form.seo')}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">{t('dashboard.products.form.metaTitle')}</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder={t('dashboard.products.form.metaTitlePlaceholder')}
                    maxLength={60}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">{t('dashboard.products.form.metaDescription')}</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder={t('dashboard.products.form.metaDescriptionPlaceholder')}
                    rows={5}
                    maxLength={160}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" /> {t('dashboard.products.form.publishSettings')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="status">{t('dashboard.products.form.productStatus')}</Label>
                      <p className="text-xs text-muted-foreground">{t('dashboard.products.form.productStatusDesc')}</p>
                    </div>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'ACTIVE' | 'DRAFT' | 'ARCHIVED') => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">{t('dashboard.products.statusBadges.active')}</SelectItem>
                        <SelectItem value="DRAFT">{t('dashboard.products.statusBadges.draft')}</SelectItem>
                        <SelectItem value="ARCHIVED">{t('dashboard.products.statusBadges.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="featured">{t('dashboard.products.form.featuredProduct')}</Label>
                      <p className="text-xs text-muted-foreground">{t('dashboard.products.form.featuredProductDesc')}</p>
                    </div>
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Fixed at bottom */}
      <div className="flex justify-end gap-2 pt-4 pb-2 border-t bg-background flex-shrink-0 relative z-10">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('dashboard.products.form.cancel')}
        </Button>
        
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>{t('dashboard.products.form.saving')}</>
          ) : (
            <>
              {isEditing ? t('dashboard.products.form.updateProduct') : t('dashboard.products.form.addProduct')}
              <Check className="w-4 h-4 mr-2" />
            </>
          )}
        </Button>
      </div>

      {/* Cloudinary Picker Dialog */}
      {showCloudinaryPicker && (
        <CloudinaryImagePicker
          open={showCloudinaryPicker}
          onOpenChange={setShowCloudinaryPicker}
          onSelect={(images) => {
            setProductImages(prev => [...prev, ...images]);
            setShowCloudinaryPicker(false);
          }}
          multiple={true}
        />
      )}

      {/* Slider Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{t('dashboard.products.preview.sliderTitle', 'معاينة شريط الكمية')}</DialogTitle>
                <DialogDescription>
                  {t('dashboard.products.preview.sliderDesc', 'شاهد كيف سيظهر الشريط لعملائك وكيف يتم احتساب السعر')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t('dashboard.products.preview.selectQuantity', 'اختر الكمية')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{testValue}</span>
                    <span className="text-lg font-bold text-muted-foreground">
                      {formData.nameAr || formData.name}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 font-bold">
                  {t('dashboard.products.preview.step', 'زيادة:')} {formData.sliderStep}
                </Badge>
              </div>

              <div className="pt-6 pb-2">
                <Slider
                  value={[testValue]}
                  min={parseInt(formData.minQuantity) || 1}
                  max={parseInt(formData.maxQuantity) || 100}
                  step={parseInt(formData.sliderStep) || 1}
                  onValueChange={(vals) => setTestValue(vals[0])}
                  className="py-4"
                />
                <div className="flex justify-between mt-2 text-xs font-bold text-muted-foreground">
                  <span>{formData.minQuantity || 1}</span>
                  <span>{formData.maxQuantity || 100}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('dashboard.products.preview.totalPrice', 'السعر الإجمالي')}
                </div>
                <div className="text-2xl font-black text-foreground">
                  {formatCurrency(testValue * (parseFloat(formData.price) || 0), formData.priceCurrency || 'SAR')}
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-1">
                <div className="flex items-center gap-2 text-primary/70 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  {t('dashboard.products.preview.coinsTotal', 'إجمالي الكوينز')}
                </div>
                <div className="text-2xl font-black text-primary">
                  {testValue * (parseInt(formData.coinsPerUnit) || 0)}
                </div>
              </div>
            </div>

            <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 gap-3 group">
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
              {t('dashboard.products.preview.addToCart', 'إضافة للسلة')}
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
