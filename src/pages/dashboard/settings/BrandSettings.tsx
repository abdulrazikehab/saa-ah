import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Download, Upload, Cloud, Loader2 } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { coreApi } from '@/lib/api';
import { CloudinaryImagePicker } from '@/components/dashboard/CloudinaryImagePicker';
import { uploadService } from '@/services/upload.service';
import { validateImageSignature } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
  code?: string;
  shortName?: string;
  brandType?: string;
  status: string;
  rechargeUsdValue?: number;
  usdValueForCoins?: number;
  safetyStock?: number;
  leadTime?: number;
  reorderPoint?: number;
  averageConsumptionPerMonth?: number;
  averageConsumptionPerDay?: number;
  abcAnalysis?: string;
  odooCategoryId?: string;
  createdAt: string;
}

export default function BrandSettings() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    image: '',

    code: '',
    shortName: '',
    brandType: '',
    status: 'Active',
    rechargeUsdValue: 0,
    usdValueForCoins: 0,
    safetyStock: 0,
    leadTime: 0,
    reorderPoint: 0,
    averageConsumptionPerMonth: 0,
    averageConsumptionPerDay: 0,
    abcAnalysis: 'C - Low Value',
    odooCategoryId: '',
    minQuantity: '',
    maxQuantity: '',
    enableSlider: false,
    applySliderToAllProducts: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [totalItems, setTotalItems] = useState(0);
  const [isServerPagination, setIsServerPagination] = useState(false);

  useEffect(() => {
    loadBrands();
  }, [currentPage, itemsPerPage]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await coreApi.getBrands({
        page: currentPage,
        limit: itemsPerPage
      });
      
      // Validate response
      if (response && 'meta' in response && Array.isArray(response.data)) {
        // Server-side pagination
        setBrands(response.data);
        setTotalItems(response.meta.total);
        setIsServerPagination(true);
      } else if (Array.isArray(response)) {
        // Client-side pagination (fallback)
        const validBrands = response.filter((b: any) =>
          b && typeof b === 'object' && b.id && !('error' in b)
        );
        setBrands(validBrands);
        setTotalItems(validBrands.length);
        setIsServerPagination(false);
      } else {
        setBrands([]);
        setTotalItems(0);
        setIsServerPagination(false);
      }
    } catch (error: any) {
      setBrands([]);
      setTotalItems(0);
      toast({
        title: 'تعذر تحميل العلامات التجارية',
        description: 'حدث خطأ أثناء تحميل العلامات التجارية. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBrand) {
        // Validate brand ID
        if (!editingBrand.id || editingBrand.id.trim() === '') {
          toast({
            title: 'خطأ',
            description: 'معرف العلامة التجارية غير صالح',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        console.log(`[BrandSettings] Updating brand with ID: ${editingBrand.id}`);
        
        await coreApi.put(`/brands/${editingBrand.id}`, {
          ...formData,
          rechargeUsdValue: parseFloat(formData.rechargeUsdValue.toString()),
          usdValueForCoins: parseFloat(formData.usdValueForCoins.toString()),
          safetyStock: parseFloat(formData.safetyStock.toString()),
          reorderPoint: parseFloat(formData.reorderPoint.toString()),
          averageConsumptionPerMonth: parseFloat(formData.averageConsumptionPerMonth.toString()),
          averageConsumptionPerDay: parseFloat(formData.averageConsumptionPerDay.toString()),
          minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
          enableSlider: formData.enableSlider,
          applySliderToAllProducts: formData.applySliderToAllProducts,
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث العلامة التجارية بنجاح',
        });
      } else {
        await coreApi.createBrand({
          ...formData,
          rechargeUsdValue: parseFloat(formData.rechargeUsdValue.toString()),
          usdValueForCoins: parseFloat(formData.usdValueForCoins.toString()),
          safetyStock: parseFloat(formData.safetyStock.toString()),
          reorderPoint: parseFloat(formData.reorderPoint.toString()),
          averageConsumptionPerMonth: parseFloat(formData.averageConsumptionPerMonth.toString()),
          averageConsumptionPerDay: parseFloat(formData.averageConsumptionPerDay.toString()),
          minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : undefined,
          maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : undefined,
          enableSlider: formData.enableSlider,
          applySliderToAllProducts: formData.applySliderToAllProducts,
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة العلامة التجارية بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadBrands();
    } catch (error: any) {
      console.error('[BrandSettings] Error saving brand:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'حدث خطأ أثناء حفظ العلامة التجارية';
      
      // Check if it's a 404 error
      if (error?.response?.status === 404) {
        toast({
          title: 'خطأ',
          description: 'العلامة التجارية غير موجودة. يرجى تحديث الصفحة وإعادة المحاولة.',
          variant: 'destructive',
        });
        // Reload brands to get fresh data
        loadBrands();
      } else {
        toast({
          title: 'تعذر حفظ العلامة التجارية',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
      setEditingBrand(null);
      loadBrands();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Check
    const { isValid, reason } = await validateImageSignature(file);
    if (!isValid) {
      toast({
        title: 'ملف غير آمن',
        description: reason || 'تم رفض الملف لأسباب أمنية',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadService.uploadImage(file);
      setFormData(prev => ({ ...prev, image: response.secureUrl || response.url }));
      toast({ title: 'تم الرفع بنجاح', description: 'تم رفع الصورة بنجاح' });
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'تعذر رفع الصورة',
        description: 'حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloudinarySelect = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, image: urls[0] }));
    }
    setShowCloudinaryPicker(false);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      nameAr: brand.nameAr || '',
      image: brand.image || '',
      code: brand.code || '',
      shortName: brand.shortName || '',
      brandType: brand.brandType || '',
      status: brand.status || 'Active',
      rechargeUsdValue: Number(brand.rechargeUsdValue) || 0,
      usdValueForCoins: Number(brand.usdValueForCoins) || 0,
      safetyStock: Number(brand.safetyStock) || 0,
      leadTime: Number(brand.leadTime) || 0,
      reorderPoint: Number(brand.reorderPoint) || 0,
      averageConsumptionPerMonth: Number(brand.averageConsumptionPerMonth) || 0,
      averageConsumptionPerDay: Number(brand.averageConsumptionPerDay) || 0,
      abcAnalysis: brand.abcAnalysis || 'C - Low Value',
      odooCategoryId: brand.odooCategoryId || '',
      minQuantity: (brand as any).minQuantity?.toString() || '',
      maxQuantity: (brand as any).maxQuantity?.toString() || '',
      enableSlider: (brand as any).enableSlider || false,
      applySliderToAllProducts: (brand as any).applySliderToAllProducts || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العلامة التجارية؟')) return;

    try {
      console.log(`[BrandSettings] Deleting brand with ID: ${id}`);
      await coreApi.delete(`/brands/${id}`, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حذف العلامة التجارية بنجاح',
      });
      loadBrands();
    } catch (error: any) {
      console.error('[BrandSettings] Error deleting brand:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'حدث خطأ أثناء حذف العلامة التجارية';
      
      // Check for specific error types
      if (error?.response?.status === 400) {
        const message = error?.response?.data?.message || errorMessage;
        if (message.includes('not found')) {
          toast({
            title: 'خطأ',
            description: 'العلامة التجارية غير موجودة. يرجى تحديث الصفحة.',
            variant: 'destructive',
          });
          loadBrands(); // Reload to refresh the list
        } else if (message.includes('used in')) {
          toast({
            title: 'تعذر الحذف',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'خطأ',
            description: message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'تعذر حذف العلامة التجارية',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteAllBrands = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع العلامات التجارية؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    
    try {
      setLoading(true);
      
      // Fetch ALL brands (not just current page) by using a very high limit
      const allBrandsResponse = await coreApi.getBrands({
        page: 1,
        limit: 10000 // Very high limit to get all brands
      });
      
      // Extract all brand IDs from the response
      let allBrandIds: string[] = [];
      if (allBrandsResponse && 'meta' in allBrandsResponse && Array.isArray(allBrandsResponse.data)) {
        // Server-side pagination response
        allBrandIds = allBrandsResponse.data.map((b: any) => b.id).filter((id: string) => id);
      } else if (Array.isArray(allBrandsResponse)) {
        // Array response (fallback)
        allBrandIds = allBrandsResponse.map((b: any) => b?.id).filter((id: string) => id);
      }
      
      if (allBrandIds.length === 0) {
        toast({ 
          title: 'معلومة', 
          description: 'لا توجد علامات تجارية للحذف', 
          variant: 'default' 
        });
        setLoading(false);
        return;
      }
      
      // OPTIMIZATION: Rate-limited deletion with retry logic and parallel processing
      const deleteWithRetry = async (id: string, retries = 3): Promise<boolean> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            await coreApi.delete(`/brands/${id}`, { requireAuth: true });
            return true;
          } catch (error: any) {
            const isRateLimit = error?.response?.status === 429 || 
                               error?.message?.includes('انتظار') || 
                               error?.message?.includes('wait');
            
            if (isRateLimit && attempt < retries - 1) {
              // Rate limited - wait with exponential backoff (reduced from 1s base to 500ms)
              const delay = 500 * Math.pow(2, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            console.error(`Failed to delete brand ${id} (attempt ${attempt + 1}/${retries}):`, error);
            return false;
          }
        }
        return false;
      };
      
      // OPTIMIZATION: Process brands in parallel with controlled concurrency (10 at a time)
      // This is much faster than sequential processing with 200ms delays
      const CONCURRENCY = 10;
      let index = 0;
      let deleted = 0;
      let failed = 0;
      const total = allBrandIds.length;
      
      const processNext = async (): Promise<void> => {
        while (index < allBrandIds.length) {
          const currentIndex = index++;
          const id = allBrandIds[currentIndex];
          
          try {
            const success = await deleteWithRetry(id);
            if (success) {
              deleted++;
            } else {
              failed++;
            }
          } catch (error) {
            console.error(`Error processing brand deletion ${id}:`, error);
            failed++;
          }
        }
      };
      
      // Start concurrent workers
      const workers = Array(Math.min(CONCURRENCY, allBrandIds.length))
        .fill(null)
        .map(() => processNext());
      
      await Promise.all(workers);
      
      if (deleted > 0) {
        toast({ 
          title: 'نجح', 
          description: `تم حذف ${deleted} من ${total} علامة تجارية بنجاح${failed > 0 ? ` (فشل ${failed})` : ''}` 
        });
      } else {
        toast({ 
          title: 'خطأ', 
          description: 'فشل حذف جميع العلامات التجارية', 
          variant: 'destructive' 
        });
      }
      
      loadBrands();
    } catch (error: any) {
      console.error('[BrandSettings] Error deleting all brands:', error);
      toast({ 
        title: 'خطأ', 
        description: error?.message || 'فشل حذف العلامات التجارية', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      image: '',
      code: '',
      shortName: '',
      brandType: '',
      status: 'Active',
      rechargeUsdValue: 0,
      usdValueForCoins: 0,
      safetyStock: 0,
      leadTime: 0,
      reorderPoint: 0,
      averageConsumptionPerMonth: 0,
      averageConsumptionPerDay: 0,
      abcAnalysis: 'C - Low Value',
      odooCategoryId: '',
      minQuantity: '',
      maxQuantity: '',
      enableSlider: false,
      applySliderToAllProducts: false,
    });
    setEditingBrand(null);
  };

  const handleExport = () => {
    const headers = [
      'ID',
      'Name',
      'NameAr',
      'Code',
      'ShortName',
      'BrandType',
      'Status',
      'RechargeUsdValue',
      'UsdValueForCoins',
      'SafetyStock',
      'LeadTime',
      'ReorderPoint',
      'AverageConsumptionPerMonth',
      'AverageConsumptionPerDay',
      'AbcAnalysis',
      'OdooCategoryId',
      'CreatedAt'
    ];

    const exportData = brands.map(brand => ({
      ID: brand.id || '',
      Name: brand.name || '',
      NameAr: brand.nameAr || '',
      Code: brand.code || '',
      ShortName: brand.shortName || '',
      BrandType: brand.brandType || '',
      Status: brand.status || '',
      RechargeUsdValue: brand.rechargeUsdValue || 0,
      UsdValueForCoins: brand.usdValueForCoins || 0,
      SafetyStock: brand.safetyStock || 0,
      LeadTime: brand.leadTime || 0,
      ReorderPoint: brand.reorderPoint || 0,
      AverageConsumptionPerMonth: brand.averageConsumptionPerMonth || 0,
      AverageConsumptionPerDay: brand.averageConsumptionPerDay || 0,
      AbcAnalysis: brand.abcAnalysis || '',
      OdooCategoryId: brand.odooCategoryId || '',
      CreatedAt: brand.createdAt || '',
    }));

    const ws = utils.json_to_sheet(exportData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Brands');
    writeFile(wb, 'brands_export.xlsx');
    
    toast({
      title: 'نجح',
      description: 'تم تصدير العلامات التجارية بنجاح',
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{
        Name: string;
        NameAr?: string;
        Code?: string;
        ShortName?: string;
        BrandType?: string;
        Status?: string;
        RechargeUsdValue?: number | string;
        UsdValueForCoins?: number | string;
        SafetyStock?: number | string;
        LeadTime?: number | string;
        ReorderPoint?: number | string;
        AverageConsumptionPerMonth?: number | string;
        AverageConsumptionPerDay?: number | string;
        AbcAnalysis?: string;
        OdooCategoryId?: string;
      }>(worksheet, { defval: '' });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        if (!row.Name || !row.Name.trim()) {
          errors.push(`Row ${rowNum}: Name is required`);
          errorCount++;
          continue;
        }

        try {
          await coreApi.createBrand({
            name: row.Name.trim(),
            nameAr: row.NameAr?.trim() || undefined,
            code: row.Code?.trim() || undefined,
            shortName: row.ShortName?.trim() || undefined,
            brandType: row.BrandType?.trim() || undefined,
            status: row.Status?.trim() || 'Active',
            rechargeUsdValue: row.RechargeUsdValue 
              ? (typeof row.RechargeUsdValue === 'string' ? parseFloat(row.RechargeUsdValue.replace(/[^\d.-]/g, '')) || 0 : row.RechargeUsdValue)
              : 0,
            usdValueForCoins: row.UsdValueForCoins
              ? (typeof row.UsdValueForCoins === 'string' ? parseFloat(row.UsdValueForCoins.replace(/[^\d.-]/g, '')) || 0 : row.UsdValueForCoins)
              : 0,
            safetyStock: row.SafetyStock
              ? (typeof row.SafetyStock === 'string' ? parseInt(row.SafetyStock.replace(/[^\d]/g, '')) || 0 : row.SafetyStock)
              : 0,
            leadTime: row.LeadTime
              ? (typeof row.LeadTime === 'string' ? parseInt(row.LeadTime.replace(/[^\d]/g, '')) || 0 : row.LeadTime)
              : 0,
            reorderPoint: row.ReorderPoint
              ? (typeof row.ReorderPoint === 'string' ? parseInt(row.ReorderPoint.replace(/[^\d]/g, '')) || 0 : row.ReorderPoint)
              : 0,
            averageConsumptionPerMonth: row.AverageConsumptionPerMonth
              ? (typeof row.AverageConsumptionPerMonth === 'string' ? parseFloat(row.AverageConsumptionPerMonth.replace(/[^\d.-]/g, '')) || 0 : row.AverageConsumptionPerMonth)
              : 0,
            averageConsumptionPerDay: row.AverageConsumptionPerDay
              ? (typeof row.AverageConsumptionPerDay === 'string' ? parseFloat(row.AverageConsumptionPerDay.replace(/[^\d.-]/g, '')) || 0 : row.AverageConsumptionPerDay)
              : 0,
            abcAnalysis: row.AbcAnalysis?.trim() || undefined,
            odooCategoryId: row.OdooCategoryId?.trim() || undefined,
          });
          successCount++;
        } catch (error: any) {
          const errorMsg = error?.message || 'Unknown error';
          errors.push(`Row ${rowNum} (${row.Name}): ${errorMsg}`);
          errorCount++;
        }
      }

      const errorText = errors.length > 0 
        ? `\n\nErrors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`
        : '';

      toast({
        title: successCount > 0 ? 'نجح الاستيراد' : 'فشل الاستيراد',
        description: `تم استيراد ${successCount} علامة تجارية${successCount !== 1 ? '' : ''}${errorCount > 0 ? `، فشل ${errorCount}` : ''}${errorText}`,
        variant: errorCount > successCount ? 'destructive' : 'default',
      });
      
      loadBrands();
      e.target.value = '';
    } catch (error: any) {
      toast({ 
        title: 'تعذر استيراد العلامات التجارية', 
        description: error?.message || 'حدث خطأ أثناء قراءة ملف الاستيراد. تأكد من صحة تنسيق الملف.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrands = isServerPagination ? brands : brands.slice(startIndex, endIndex);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBrands(new Set(paginatedBrands.map(b => b.id)));
    } else {
      setSelectedBrands(new Set());
    }
  };

  const handleSelectAllBrands = async () => {
    try {
      setLoading(true);
      // Fetch all brands with a very large limit to get all IDs
      const allBrandsResponse = await coreApi.getBrands({
        page: 1,
        limit: 10000
      });
      
      let allBrandIds: string[] = [];
      if (allBrandsResponse && 'meta' in allBrandsResponse && Array.isArray(allBrandsResponse.data)) {
        // Server-side pagination response
        allBrandIds = allBrandsResponse.data.map((b: any) => b.id).filter((id: string) => id);
      } else if (Array.isArray(allBrandsResponse)) {
        // Array response (fallback)
        allBrandIds = allBrandsResponse.map((b: any) => b?.id).filter((id: string) => id);
      }
      
      setSelectedBrands(new Set(allBrandIds));
      toast({
        title: 'نجح',
        description: `تم تحديد ${allBrandIds.length} علامة تجارية`,
      });
    } catch (error: any) {
      console.error('Failed to select all brands:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحديد جميع العلامات التجارية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectBrand = (id: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBrands(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedBrands.size === 0) {
      toast({
        title: 'تنبيه',
        description: 'لم يتم تحديد أي علامة تجارية',
        variant: 'destructive',
      });
      return;
    }
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedBrands.size} علامة تجارية؟`)) return;
    
    setLoading(true);
    let successCount = 0;
    let failedCount = 0;
    const allIds = Array.from(selectedBrands);
    const total = allIds.length;
    
    // OPTIMIZATION: Rate-limited deletion with retry logic and parallel processing
    const deleteWithRetry = async (id: string, retries = 3): Promise<boolean> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          await coreApi.delete(`/brands/${id}`, { requireAuth: true });
          return true;
        } catch (error: any) {
          const isRateLimit = error?.response?.status === 429 || 
                             error?.message?.includes('انتظار') || 
                             error?.message?.includes('wait');
          
          if (isRateLimit && attempt < retries - 1) {
            // Rate limited - wait with exponential backoff (reduced from 1s base to 500ms)
            const delay = 500 * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Other errors or max retries reached
          console.error(`Failed to delete brand ${id} (attempt ${attempt + 1}/${retries}):`, error);
          return false;
        }
      }
      return false;
    };
    
    // OPTIMIZATION: Process brands in parallel with controlled concurrency (10 at a time)
    // This is much faster than sequential processing with 300ms delays
    const CONCURRENCY = 10;
    let index = 0;
    
    const processNext = async (): Promise<void> => {
      while (index < allIds.length) {
        const currentIndex = index++;
        const id = allIds[currentIndex];
        
        try {
          const success = await deleteWithRetry(id);
          if (success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Error processing brand deletion ${id}:`, error);
          failedCount++;
        }
      }
    };
    
    // Start concurrent workers
    const workers = Array(Math.min(CONCURRENCY, allIds.length))
      .fill(null)
      .map(() => processNext());
    
    await Promise.all(workers);
    
    toast({
      title: successCount > 0 ? 'تم الحذف' : 'فشل الحذف',
      description: `تم حذف ${successCount} من أصل ${total} علامة تجارية${failedCount > 0 ? ` (فشل ${failedCount})` : ''}`,
      variant: successCount === 0 ? 'destructive' : 'default',
    });
    
    setSelectedBrands(new Set());
    loadBrands();
    setLoading(false);
  };

  const isAllSelected = paginatedBrands.length > 0 && paginatedBrands.every(b => selectedBrands.has(b.id));
  const isSomeSelected = selectedBrands.size > 0 && selectedBrands.size < paginatedBrands.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة العلامات التجارية</h2>
          <p className="text-gray-600 dark:text-gray-400">إضافة وإدارة العلامات التجارية للمنتجات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSelectAllBrands}
            disabled={loading || totalItems === 0}
          >
            <Package className="h-4 w-4 mr-2" />
            تحديد الكل
          </Button>
          {selectedBrands.size > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              حذف المحدد ({selectedBrands.size})
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeleteAllBrands} disabled={brands.length === 0 || loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            حذف الكل
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                استيراد
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة علامة تجارية
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة العلامات التجارية</CardTitle>
          <CardDescription>جميع العلامات التجارية المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedBrands.has(brand.id)}
                      onCheckedChange={() => toggleSelectBrand(brand.id)}
                      aria-label={`Select ${brand.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{String(brand.name || '')}</div>
                      {brand.nameAr && (
                        <div className="text-sm text-gray-500">{brand.nameAr}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {brand.code || '-'}
                    </span>
                  </TableCell>
                  <TableCell>{brand.brandType || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      brand.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {brand.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            عرض {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} علامة تجارية
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <div className="text-sm font-medium">
              صفحة {currentPage} من {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              التالي
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'تعديل علامة تجارية' : 'إضافة علامة تجارية جديدة'}</DialogTitle>
            <DialogDescription>املأ المعلومات التالية لإضافة علامة تجارية جديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>شعار العلامة التجارية</Label>
              <div className="space-y-4">
                {formData.image && (
                  <div className="relative group w-full max-w-[200px] aspect-square mx-auto">
                    <img
                      src={formData.image}
                      alt="Brand Logo"
                      className="w-full h-full object-contain rounded-md border shadow-sm bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      رفع صورة
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => setShowCloudinaryPicker(true)}
                    >
                      <Cloud className="h-4 w-4" />
                      المكتبة
                    </Button>
                  </div>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="أو أدخل رابط الصورة يدوياً"
                    className="text-xs"
                  />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم العلامة التجارية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameAr">اسم العلامة التجارية (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">كود العلامة التجارية</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: E01006"
                />
              </div>
              <div>
                <Label htmlFor="shortName">الاسم المختصر</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brandType">نوع العلامة التجارية</Label>
                <Input
                  id="brandType"
                  value={formData.brandType}
                  onChange={(e) => setFormData({ ...formData, brandType: e.target.value })}
                  placeholder="مثال: اتصالات وانترنت"
                />
              </div>
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">نشط</SelectItem>
                    <SelectItem value="Inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rechargeUsdValue">قيمة إعادة الشحن (USD)</Label>
                <Input
                  id="rechargeUsdValue"
                  type="number"
                  step="0.01"
                  value={formData.rechargeUsdValue}
                  onChange={(e) => setFormData({ ...formData, rechargeUsdValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="usdValueForCoins">قيمة العملات (USD)</Label>
                <Input
                  id="usdValueForCoins"
                  type="number"
                  step="0.01"
                  value={formData.usdValueForCoins}
                  onChange={(e) => setFormData({ ...formData, usdValueForCoins: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="safetyStock">مخزون الأمان</Label>
                <Input
                  id="safetyStock"
                  type="number"
                  step="0.01"
                  value={formData.safetyStock}
                  onChange={(e) => setFormData({ ...formData, safetyStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="leadTime">وقت التوريد (أيام)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reorderPoint">نقطة إعادة الطلب</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  step="0.01"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="abcAnalysis">تحليل ABC</Label>
                <Select
                  value={formData.abcAnalysis}
                  onValueChange={(value) => setFormData({ ...formData, abcAnalysis: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A - High Value">A - قيمة عالية</SelectItem>
                    <SelectItem value="B - Medium Value">B - قيمة متوسطة</SelectItem>
                    <SelectItem value="C - Low Value">C - قيمة منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="averageConsumptionPerMonth">متوسط الاستهلاك الشهري</Label>
                <Input
                  id="averageConsumptionPerMonth"
                  type="number"
                  step="0.01"
                  value={formData.averageConsumptionPerMonth}
                  onChange={(e) => setFormData({ ...formData, averageConsumptionPerMonth: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="averageConsumptionPerDay">متوسط الاستهلاك اليومي</Label>
                <Input
                  id="averageConsumptionPerDay"
                  type="number"
                  step="0.01"
                  value={formData.averageConsumptionPerDay}
                  onChange={(e) => setFormData({ ...formData, averageConsumptionPerDay: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="odooCategoryId">معرف فئة Odoo</Label>
              <Input
                id="odooCategoryId"
                value={formData.odooCategoryId}
                onChange={(e) => setFormData({ ...formData, odooCategoryId: e.target.value })}
                placeholder="يتم تعيينه بعد المزامنة مع Odoo"
              />
            </div>

            {/* Quantity Slider Section for Supplier API Integration */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableSlider" className="text-base font-semibold">
                    شريط الكمية للشراء (Slider)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    تفعيل شريط اختيار الكمية عند الشراء - سيتم تطبيقه على جميع منتجات هذه العلامة التجارية
                  </p>
                </div>
                <Switch
                  id="enableSlider"
                  checked={formData.enableSlider}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableSlider: checked })}
                />
              </div>
              
              {formData.enableSlider && (
                <>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="minQuantity">الحد الأدنى للكمية</Label>
                      <Input
                        id="minQuantity"
                        type="number"
                        min="1"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxQuantity">الحد الأقصى للكمية</Label>
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
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="applySliderToAllProducts"
                      checked={formData.applySliderToAllProducts}
                      onCheckedChange={(checked) => setFormData({ ...formData, applySliderToAllProducts: checked })}
                    />
                    <Label htmlFor="applySliderToAllProducts" className="text-sm">
                      تطبيق على جميع منتجات هذه العلامة التجارية
                    </Label>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CloudinaryImagePicker
        open={showCloudinaryPicker}
        onOpenChange={setShowCloudinaryPicker}
        onSelect={handleCloudinarySelect}
        multiple={false}
      />
    </div>
  );
}

