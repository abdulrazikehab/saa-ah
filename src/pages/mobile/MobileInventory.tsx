import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, Download, Copy, Check, 
  AlertCircle, Package, History, ShieldCheck, Loader2, 
  RefreshCw, ShoppingBag, ExternalLink, Mail, MessageCircle,
  QrCode, MoreVertical
} from 'lucide-react';
import { apiClient } from '@/services/core/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface InventoryItem {
  id: string;
  serialNumber: string;
  pin?: string;
  productName: string;
  productNameAr: string;
  orderNumber: string;
  purchasedAt: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'SOLD';
}

export default function MobileInventory() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<InventoryItem[]>('/customer/inventory', { requireAuth: true });
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('inventory.fetchError', 'Failed to load inventory'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchInventory();
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, [fetchInventory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: t('common.copied', 'Copied') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsUsed = async (id: string) => {
    try {
      await apiClient.post('/customer/inventory/use', { ids: [id] }, { requireAuth: true });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'USED' } : item));
      toast({ title: t('common.updated', 'Updated') });
    } catch (error) {
      toast({ title: t('common.error', 'Error'), variant: 'destructive' });
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter === 'ACTIVE') result = result.filter(i => i.status === 'ACTIVE' || i.status === 'SOLD');
    if (statusFilter === 'USED') result = result.filter(i => i.status === 'USED');
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.productName.toLowerCase().includes(q) || 
        i.serialNumber.toLowerCase().includes(q) ||
        i.orderNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, statusFilter, searchQuery]);

  const primaryColor = activeConfig?.primaryColor || '#000000';

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" style={{ color: primaryColor }} />
    </div>
  );

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors text-foreground">
               <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{t('profile.digitalKeys', 'My Inventory')}</h1>
          </div>
          <button onClick={fetchInventory} className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
      </div>

      <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('common.search', 'Search your cards...')}
                className="pl-10 h-11 rounded-xl bg-card border-border shadow-sm text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
              {['ALL', 'ACTIVE', 'USED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${statusFilter === f ? 'text-white shadow-md' : 'bg-card text-muted-foreground border border-border'}`}
                    style={{ backgroundColor: statusFilter === f ? primaryColor : undefined }}
                  >
                    {f === 'ALL' ? t('common.all', 'All') : f === 'ACTIVE' ? t('inventory.active', 'Active') : t('inventory.used', 'Used')}
                  </button>
              ))}
          </div>

          {/* List */}
          <div className="space-y-4">
              {filteredItems.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">{t('inventory.noItems', 'No cards found')}</p>
                  </div>
              ) : (
                  filteredItems.map((item) => (
                      <div key={item.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-4 relative overflow-hidden group">
                          {/* Status Ribbon */}
                          <div 
                            className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'USED' ? 'bg-muted text-muted-foreground' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}
                            style={item.status !== 'USED' ? { color: primaryColor, backgroundColor: `${primaryColor}15` } : undefined}
                          >
                              {item.status}
                          </div>

                          <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors" style={{ color: item.status !== 'USED' ? primaryColor : undefined }}>
                                  <QrCode size={24} />
                              </div>
                              <div className="flex-1 min-w-0 pr-16 text-left">
                                  <h3 className="font-bold text-foreground truncate text-sm">
                                      {isRTL && item.productNameAr ? item.productNameAr : item.productName}
                                  </h3>
                                  <p className="text-[10px] text-muted-foreground font-medium">Order #{item.orderNumber}</p>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <div className="bg-muted/50 p-3 rounded-xl border border-dashed border-border flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Serial Number</p>
                                      <p className="font-mono text-xs font-bold text-foreground truncate">{item.serialNumber}</p>
                                  </div>
                                  <button 
                                    onClick={() => handleCopy(item.serialNumber, item.id)}
                                    className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground"
                                  >
                                      {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                  </button>
                              </div>

                              {item.pin && (
                                <div className="bg-muted/50 p-3 rounded-xl border border-dashed border-border flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">PIN Code</p>
                                        <p className="font-mono text-sm font-black text-primary" style={{ color: primaryColor }}>{item.pin}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(item.pin!, item.id + '-pin')}
                                        className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground"
                                    >
                                        {copiedId === item.id + '-pin' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                               <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                   {new Date(item.purchasedAt).toLocaleDateString()}
                               </p>
                               <div className="flex gap-2">
                                   {(item.status === 'ACTIVE' || item.status === 'SOLD') && (
                                       <button 
                                          onClick={() => handleMarkAsUsed(item.id)}
                                          className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full"
                                       >
                                           Mark as Used
                                       </button>
                                   )}
                                   <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                           <button className="p-1.5 text-muted-foreground bg-muted/50 rounded-full hover:bg-muted transition-colors"><MoreVertical size={16} /></button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="rounded-xl">
                                           <DropdownMenuItem className="text-xs font-bold gap-2">
                                               <Mail size={14} /> Send to Email
                                           </DropdownMenuItem>
                                           <DropdownMenuItem className="text-xs font-bold gap-2">
                                               <MessageCircle size={14} /> Send to WhatsApp
                                           </DropdownMenuItem>
                                           <DropdownMenuSeparator />
                                           <DropdownMenuItem className="text-xs font-bold gap-2">
                                               <ExternalLink size={14} /> View Order
                                           </DropdownMenuItem>
                                       </DropdownMenuContent>
                                   </DropdownMenu>
                               </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
}
