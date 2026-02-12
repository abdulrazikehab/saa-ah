import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { inventoryApi } from '@/lib/inventory-api';
import { Search, RefreshCw, Copy, AlertCircle, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { productService } from '@/services/product.service';
import { Category, Brand } from '@/services/types';

interface CardInventoryItem {
  id: string;
  cardCode: string;
  cardPin?: string;
  status: string;
  importedAt: string;
  product?: {
    id: string;
    name: string;
    nameAr?: string;
    sku?: string;
    category?: { id: string; name: string; nameAr: string };
    brand?: { id: string; name: string; nameAr: string };
  };
}

export const DigitalCardsInventoryTab = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const [items, setItems] = useState<CardInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [categoryId, setCategoryId] = useState('ALL');
  const [brandId, setBrandId] = useState('ALL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFilters = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        productService.getCategories({ all: true }, true),
        productService.getBrands({}, true)
      ]);
      
      setCategories(Array.isArray(catsRes) ? catsRes : catsRes.categories || []);
      setBrands(Array.isArray(brandsRes) ? brandsRes : brandsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getAllCardInventory(
        page, 
        50, 
        search, 
        status, 
        categoryId === 'ALL' ? undefined : categoryId,
        brandId === 'ALL' ? undefined : brandId
      );
      setItems(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch digital cards inventory:', error);
      toast.error(t('common.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, categoryId, brandId, t]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">{t('dashboard.products.available')}</Badge>;
      case 'SOLD':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('dashboard.orders.paid')}</Badge>;
      case 'RESERVED':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t('dashboard.orders.pending')}</Badge>;
      case 'INVALID':
        return <Badge variant="destructive">{t('dashboard.inventory.emergencyInventory')}</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">{t('dashboard.products.expired') || 'Expired'}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getName = (obj: { name?: string; nameAr?: string } | undefined | null) => {
    if (!obj) return '-';
    return isAr ? (obj.nameAr || obj.name || '-') : (obj.name || '-');
  };

  return (
    <div className="space-y-4">
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder={t('dashboard.products.searchPlaceholder')}
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </form>
            
            <Button variant="outline" className="gap-2" onClick={() => fetchItems()}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3 h-3" /> {t('dashboard.inventory.status')}
                </label>
                <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                    <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.products.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="ALL">{t('common.all')}</SelectItem>
                    <SelectItem value="AVAILABLE">{t('dashboard.products.available')} ({t('common.notUsed') || 'Not Used'})</SelectItem>
                    <SelectItem value="SOLD">{t('dashboard.orders.paid')} ({t('common.used') || 'Used'})</SelectItem>
                    <SelectItem value="USED">{t('common.allUsed') || 'All Used (Sold/Invalid)'}</SelectItem>
                    <SelectItem value="NOT_USED">{t('common.allNotUsed') || 'All Not Used (Available)'}</SelectItem>
                    <SelectItem value="RESERVED">{t('dashboard.orders.pending')}</SelectItem>
                    <SelectItem value="INVALID">{t('dashboard.inventory.emergencyInventory')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('dashboard.products.expired') || 'Expired'}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3 h-3" /> {t('dashboard.products.category')}
                </label>
                <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setPage(1); }}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('dashboard.products.allCategories')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t('common.all')}</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{getName(cat)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Filter className="w-3 h-3" /> {t('dashboard.products.brand')}
                </label>
                <Select value={brandId} onValueChange={(val) => { setBrandId(val); setPage(1); }}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('dashboard.products.allBrands')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t('common.all')}</SelectItem>
                        {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{getName(brand)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-end">
                <Button 
                    variant="ghost" 
                    className="text-xs text-muted-foreground hover:text-primary w-full justify-start"
                    onClick={() => {
                        setSearch('');
                        setStatus('ALL');
                        setCategoryId('ALL');
                        setBrandId('ALL');
                        setPage(1);
                    }}
                >
                    {t('common.resetFilters') || 'Clear Filters'}
                </Button>
            </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t('dashboard.inventory.productName')}</TableHead>
              <TableHead>{t('dashboard.products.category')}</TableHead>
              <TableHead>{t('dashboard.products.brand')}</TableHead>
              <TableHead>{t('dashboard.inventory.serialNumber')}</TableHead>
              <TableHead>{t('dashboard.inventory.pin')}</TableHead>
              <TableHead>{t('dashboard.inventory.status')}</TableHead>
              <TableHead>{t('dashboard.inventory.importedAt')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-8 h-8" />
                    <p>{t('common.noData')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{getName(item.product)}</span>
                      {item.product?.sku && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">SKU: {item.product.sku}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {getName(item.product?.category)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getName(item.product?.brand)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 group">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono select-all">
                        {item.cardCode}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => copyToClipboard(item.cardCode)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.cardPin ? (
                       <div className="flex items-center gap-2 group">
                        <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono select-all">
                          {item.cardPin}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => copyToClipboard(item.cardPin)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                        <span className="text-muted-foreground text-xs italic opacity-50">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-[10px] whitespace-nowrap">
                    {new Date(item.importedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
             {t('common.showingResults', { 
               start: (page - 1) * 50 + 1, 
               end: Math.min(page * 50, items.length + (page - 1) * 50), 
               total: totalPages * 50 
             })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('common.previous')}
            </Button>
            <div className="flex items-center px-4 font-medium text-sm border rounded-md">
                {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
