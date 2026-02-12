import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle, 
  Package, 
  Calendar, 
  Hash, 
  ExternalLink,
  ChevronDown,
  MoreVertical,
  History,
  ShieldCheck,
  Eye,
  Loader2,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  FileText,
  Mail,
  MessageCircle
} from 'lucide-react';
import { apiClient } from '@/services/core/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { Link } from 'react-router-dom';

interface InventoryItem {
  id: string;
  serialNumber: string;
  pin?: string;
  productName: string;
  productNameAr: string;
  orderNumber: string;
  purchasedAt: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'SOLD' | 'INVALID';
}

export default function CustomerInventory() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<InventoryItem[]>('/customer/inventory', { requireAuth: true });
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast({
        title: isRTL ? 'خطأ في التحميل' : 'Loading Error',
        description: isRTL ? 'فشل تحميل المخزون الخاص بك' : 'Failed to load your inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isRTL, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: isRTL ? 'تم النسخ' : 'Copied',
      description: isRTL ? 'تم نسخ النص إلى الحافظة' : 'Text copied to clipboard',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsUsed = async (id: string) => {
    try {
      await apiClient.post('/customer/inventory/use', { ids: [id] }, { requireAuth: true });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'USED' as 'USED' | 'ACTIVE' | 'EXPIRED' | 'SOLD' } : item));
      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم وضع العلامة كـ "مستخدم"' : 'Marked as used',
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحديث الحالة' : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (format: 'text' | 'excel' | 'pdf', ids?: string[]) => {
    try {
      const selectedIds = ids || items.map(i => i.id);
      if (selectedIds.length === 0) return;

      // Use native fetch to handle blob/stream
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`${apiClient.coreUrl}/customer/inventory/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Domain': window.location.hostname,
        },
        body: JSON.stringify({ ids: selectedIds, format }),
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format === 'text' ? 'txt' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: 'USED' as 'USED' | 'ACTIVE' | 'EXPIRED' | 'SOLD' } : item));
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ في التحميل' : 'Download Error',
        description: isRTL ? 'فشل تحميل الملف' : 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (ids?: string[]) => {
    try {
      const selectedIds = ids || items.map(i => i.id);
      if (selectedIds.length === 0) return;
      await apiClient.post('/customer/inventory/send-email', { ids: selectedIds }, { requireAuth: true });
      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: 'USED' as 'USED' | 'ACTIVE' | 'EXPIRED' | 'SOLD' } : item));
      toast({
        title: isRTL ? 'تم الإرسال' : 'Sent',
        description: isRTL ? 'تم إرسال المخزون إلى بريدك الإلكتروني وتم تحديث الحالة' : 'Inventory sent to your email and status updated',
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إرسال البريد' : 'Failed to send email',
        variant: 'destructive',
      });
    }
  };

  const handleSendWhatsApp = async (ids?: string[]) => {
    try {
      const selectedIds = ids || items.map(i => i.id);
      if (selectedIds.length === 0) return;
      await apiClient.post('/customer/inventory/send-whatsapp', { ids: selectedIds }, { requireAuth: true });
      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: 'USED' as 'USED' | 'ACTIVE' | 'EXPIRED' | 'SOLD' } : item));
      toast({
        title: isRTL ? 'تم الإرسال' : 'Sent',
        description: isRTL ? 'سيتم إرسال الملف عبر WhatsApp وتم تحديث الحالة' : 'File will be sent via WhatsApp and status updated',
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إرسال WhatsApp' : 'Failed to send WhatsApp',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (statusFilter !== 'ALL') {
      result = result.filter(item => {
          const s = item.status?.toUpperCase();
          if (statusFilter === 'ACTIVE') return s === 'SOLD' || s === 'ACTIVE';
          return s === statusFilter;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.serialNumber.toLowerCase().includes(query) ||
        item.productName.toLowerCase().includes(query) ||
        (item.productNameAr && item.productNameAr.includes(query)) ||
        item.orderNumber.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const active = items.filter(i => i.status === 'SOLD' || i.status === 'ACTIVE').length;
    const used = items.filter(i => i.status === 'USED' || i.status === 'INVALID').length;
    return { active, used, total: items.length };
  }, [items]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">
            {isRTL ? 'جاري جلب بطاقاتك...' : 'Fetching your cards...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-3 mb-2"
            >
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {isRTL ? 'مخزون بطاقاتي' : 'My Card Inventory'}
              </h1>
            </motion.div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {isRTL 
                ? 'قم بإدارة الأرقام التسلسلية لبطاقاتك المشتراة، واستخدمها، أو قم بتحميلها في أي وقت.' 
                : 'Manage your purchased card serials, use them, or download at any time.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={fetchInventory} disabled={isLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isRTL ? 'تحديث' : 'Refresh'}
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4" />
                    {isRTL ? 'تحميل الكل' : 'Download All'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                  <DropdownMenuItem onClick={() => handleDownload('excel')}>
                    <History className="h-4 w-4 mr-2" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('text')}>
                    <FileText className="h-4 w-4 mr-2" /> Text (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                    <AlertCircle className="h-4 w-4 mr-2" /> PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSendEmail()}>
                    <Mail className="h-4 w-4 mr-2" /> {isRTL ? 'إرسال للبريد' : 'Send to Email'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendWhatsApp()}>
                    <MessageCircle className="h-4 w-4 mr-2" /> {isRTL ? 'إرسال WhatsApp' : 'Send to WhatsApp'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
           {[
             { label: isRTL ? 'الإجمالي' : 'Total Cards', value: stats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
             { label: isRTL ? 'نشط' : 'Active Cards', value: stats.active, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
             { label: isRTL ? 'مستخدم' : 'Used Cards', value: stats.used, icon: History, color: 'text-amber-500', bg: 'bg-amber-500/10' },
           ].map((stat, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4"
             >
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                   <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Filters Section */}
        <Card className="mb-8 border-none bg-card/50 backdrop-blur-xl shadow-xl shadow-gray-200/50 dark:shadow-none">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={isRTL ? 'ابحث برقم التسلسل أو المنتج...' : 'Search by serial or product...'} 
                  className="pl-10 h-12 bg-background border-border/50 rounded-xl focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs 
                value={statusFilter} 
                onValueChange={(v: string) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED')}
                className="w-full lg:w-auto overflow-x-auto"
              >
                <TabsList className="h-12 bg-muted p-1 rounded-xl">
                  <TabsTrigger value="ALL" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    {isRTL ? 'الكل' : 'All'}
                  </TabsTrigger>
                  <TabsTrigger value="ACTIVE" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    {isRTL ? 'نشط' : 'Active'}
                  </TabsTrigger>
                  <TabsTrigger value="USED" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    {isRTL ? 'مستخدم' : 'Used'}
                  </TabsTrigger>
                  <TabsTrigger value="EXPIRED" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    {isRTL ? 'منتهي' : 'Expired'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="group border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 bg-card text-card-foreground rounded-3xl overflow-hidden h-full flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          item.status === 'USED' || item.status === 'INVALID' 
                            ? 'bg-muted text-muted-foreground' 
                            : item.status === 'EXPIRED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-success/10 text-success'
                        }`}>
                          {item.status === 'USED' || item.status === 'INVALID' ? (isRTL ? 'مستخدم' : 'USED') : 
                           item.status === 'EXPIRED' ? (isRTL ? 'منتهي' : 'EXPIRED') : 
                           (isRTL ? 'نشط' : 'ACTIVE')}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleCopy(item.serialNumber, item.id)}>
                               <Copy className="h-4 w-4 mr-2" /> {isRTL ? 'نسخ SN' : 'Copy SN'}
                            </DropdownMenuItem>
                            {item.pin && (
                               <DropdownMenuItem onClick={() => handleCopy(item.pin!, item.id + '-pin')}>
                                  <Hash className="h-4 w-4 mr-2" /> {isRTL ? 'نسخ PIN' : 'Copy PIN'}
                               </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDownload('text', [item.id])}>
                               <Download className="h-4 w-4 mr-2" /> {isRTL ? 'تحميل' : 'Download'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail([item.id])}>
                               <Mail className="h-4 w-4 mr-2" /> {isRTL ? 'إرسال للبريد' : 'Send to Email'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendWhatsApp([item.id])}>
                               <MessageCircle className="h-4 w-4 mr-2" /> {isRTL ? 'إرسال WhatsApp' : 'Send to WhatsApp'}
                            </DropdownMenuItem>
                            {(item.status === 'SOLD' || item.status === 'ACTIVE') && (
                              <DropdownMenuItem onClick={() => handleMarkAsUsed(item.id)} className="text-amber-600">
                                 <CheckCircle2 className="h-4 w-4 mr-2" /> {isRTL ? 'تعيين كمستخدم' : 'Mark as Used'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="text-xl font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {isRTL && item.productNameAr ? item.productNameAr : item.productName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{isRTL ? 'طلب' : 'Order'} #{item.orderNumber}</span>
                      </div>

                      {/* Serial Display Block */}
                      <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-2xl border border-dashed border-border group-hover:border-primary/30 transition-colors">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {isRTL ? 'الرقم التسلسلي' : 'SERIAL NUMBER'}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                             <code className="text-sm font-mono font-bold break-all text-primary">{item.serialNumber}</code>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 rounded-lg hover:bg-background shadow-sm"
                               onClick={() => handleCopy(item.serialNumber, item.id)}
                             >
                               {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                             </Button>
                          </div>
                        </div>

                        {item.pin && (
                          <div className="bg-muted/50 p-4 rounded-2xl border border-dashed border-border group-hover:border-primary/30 transition-colors">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              {isRTL ? 'الرقم السري' : 'PIN CODE'}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                               <code className="text-base font-mono font-bold text-primary break-all">{item.pin}</code>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                                 onClick={() => handleCopy(item.pin!, item.id + '-pin')}
                               >
                                 {copiedId === item.id + '-pin' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                               </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                       <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(item.purchasedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                       </div>
                       <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                          <Link to={`/account/orders`} className="flex items-center gap-1">
                             {isRTL ? 'التفاصيل' : 'Details'}
                             <ArrowRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                          </Link>
                       </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-24 bg-card/50 rounded-3xl border-2 border-dashed border-border/50"
            >
               <div className="max-w-md mx-auto">
                  <Package className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
                  <h3 className="text-2xl font-bold mb-2">
                    {isRTL ? 'لا توجد نتائج' : 'No cards found'}
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    {isRTL 
                      ? 'لم نجد أي بطاقات تطابق بحثك حالياً.' 
                      : "We couldn't find any cards matching your criteria right now."}
                  </p>
                  <Button asChild size="lg" className="rounded-2xl px-8 h-12">
                    <Link to={settings?.storeType === 'DIGITAL_CARDS' ? "/cards" : "/products"}>
                      {isRTL ? 'تسوق الآن' : 'Shop Now'}
                      <ArrowRight className={`ml-2 h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
