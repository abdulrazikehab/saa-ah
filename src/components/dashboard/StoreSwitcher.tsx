import { useState, useEffect } from 'react';
import { Store, Plus, Check, Loader2, ChevronDown, Crown, AlertCircle, Trash2, Smartphone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Market {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  createdAt: string;
  isOwner: boolean;
  isActive: boolean;
}

export function StoreSwitcher() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, refreshUser, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [canCreate, setCanCreate] = useState({ allowed: false, currentCount: 0, limit: 1 });
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [marketToDelete, setMarketToDelete] = useState<Market | null>(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const [marketsData, canCreateData] = await Promise.all([
        authService.getUserMarkets(),
        authService.canCreateMarket(),
      ]);
      setMarkets(marketsData || []);
      setCanCreate(canCreateData);
    } catch (error) {
      console.error('Failed to load markets:', error);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchStore = async (tenantId: string) => {
    if (switching || tenantId === user?.tenantId) return;
    
    try {
      setSwitching(true);
      
      // Clear storefront tenant overrides to ensure mobile preview matches the new dashboard store
      localStorage.removeItem('storefrontTenantId');
      sessionStorage.removeItem('storefrontTenantId');
      localStorage.removeItem('storefrontTenantSubdomain');

      const result = await authService.switchStore(tenantId);
      
      // Use loginWithTokens to properly synchronize tokens and user state
      if (result.accessToken && result.refreshToken) {
        await loginWithTokens(result.accessToken, result.refreshToken);
        
        toast({
          title: t('common.success'),
          description: isRTL 
            ? `تم التحويل إلى متجر "${result.tenantName || 'المتجر'}"`
            : `Switched to ${result.tenantName || 'store'}`,
        });
        
        // Reload to refresh all data with new tenant context
        window.location.reload();
      } else {
        throw new Error('Failed to obtain new session tokens');
      }
    } catch (error: unknown) {
      console.error('Failed to switch store:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.switchFailed', 'Failed to switch store');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateStore = () => {
    navigate('/setup');
  };

  const handleDeleteClick = (e: React.MouseEvent, market: Market) => {
    e.stopPropagation(); // Prevent switching store when clicking delete
    setMarketToDelete(market);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!marketToDelete) return;

    // Prevent deleting active market
    if (marketToDelete.id === user?.tenantId) {
      toast({
        title: t('common.error'),
        description: isRTL 
          ? 'لا يمكن حذف المتجر النشط. يرجى التبديل إلى متجر آخر أولاً.'
          : 'Cannot delete the active market. Please switch to another market first.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      setMarketToDelete(null);
      return;
    }

    try {
      setDeleting(true);
      await authService.deleteMarket(marketToDelete.id);
      
      toast({
        title: t('common.success'),
        description: isRTL 
          ? `تم حذف المتجر "${marketToDelete.name}" بنجاح`
          : `Market "${marketToDelete.name}" deleted successfully`,
      });

      // Reload markets list
      await loadMarkets();
      
      // Refresh user data
      await refreshUser();
    } catch (error: unknown) {
      console.error('Failed to delete market:', error);
      const errorMessage = error instanceof Error ? error.message : (isRTL ? 'فشل حذف المتجر' : 'Failed to delete market');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setMarketToDelete(null);
    }
  };

  const currentMarket = markets.find(m => m.id === user?.tenantId);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">{t('common.loading')}</span>
      </Button>
    );
  }

  // No markets - show create button that redirects to setup when clicked
  if (markets.length === 0) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleCreateStore}
        className="gap-2 bg-gradient-to-r from-primary to-primary/80"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t('marketSetup.createStore', 'إنشاء متجر')}</span>
      </Button>
    );
  }

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      'STARTER': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      'PROFESSIONAL': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'ENTERPRISE': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return planColors[plan] || planColors['STARTER'];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={switching}
          className="gap-2 min-w-[160px] justify-between shadow-sm hover:shadow-md transition-all truncate"
        >
          {switching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="truncate">{t('common.switching', 'جاري التبديل...')}</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Store className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="truncate font-semibold text-xs sm:text-sm max-w-[120px]">
                  {currentMarket?.name || t('dashboard.selectStore', 'اختر متجر')}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-[320px] p-1.5 shadow-2xl border-primary/10">
        {/* Header with count */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <DropdownMenuLabel className="p-0 font-bold text-xs">
            {t('dashboard.stores', 'متاجري')}
          </DropdownMenuLabel>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {canCreate.currentCount}/{canCreate.limit}
          </Badge>
        </div>
        
        {/* Scrollable Markets List */}
        <ScrollArea className="max-h-[300px]">
          <div className="py-1">
            {markets.map((market) => {
              const isActive = market.id === user?.tenantId;
              const canDelete = market.isOwner && !isActive;
              return (
                <div
                  key={market.id}
                  className={`flex flex-col gap-2 px-2 py-2 mx-1 my-1 rounded-xl transition-all duration-200 border ${
                    isActive 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'hover:bg-accent border-transparent'
                  }`}
                >
                  <div
                    onClick={() => !isActive && handleSwitchStore(market.id)}
                    className={`flex items-center gap-2.5 w-full p-0.5 rounded-md transition-colors ${
                      !isActive && !switching ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* Store Icon */}
                    <div className={`h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Store className="h-4.5 w-4.5" />
                    </div>
                    
                    {/* Store Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold text-xs truncate text-foreground" 
                          title={market.name}
                        >
                          {market.name}
                        </span>
                        {market.isOwner && (
                          <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        )}
                        {isActive && (
                          <div className="ms-auto flex-shrink-0">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span 
                          className="text-[9px] text-muted-foreground truncate font-mono"
                          title={market.subdomain}
                        >
                          {market.subdomain}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[8px] px-1 py-0 h-3.5 border-none shadow-sm ${getPlanBadge(market.plan)}`}
                        >
                          {market.plan}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Area - Full width fill buttons */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-1.5 border-t border-muted/20">
                    {/* Visit Store Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg text-foreground transition-all gap-1 text-[10px] font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open storefront in a new tab
                        const host = window.location.hostname;
                        const isLocal = host === 'localhost' || host.includes('127.0.0.1');
                        const url = isLocal 
                          ? `http://${market.subdomain}.localhost:8080`
                          : `https://${market.subdomain}.${host.replace('app.', '').replace('manager.', '')}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{isRTL ? 'زيارة المتجر' : 'زيارة'}</span>
                    </Button>

                    {/* Mobile App Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-7 rounded-lg text-foreground transition-all gap-1 text-[10px] font-medium ${canDelete ? 'col-span-1' : 'col-span-1'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Robust local check
                        const hostname = window.location.hostname;
                        const isLocal = hostname === 'localhost' || 
                                         hostname === '127.0.0.1' || 
                                         hostname.startsWith('192.168.') || 
                                         hostname.includes('nip.io') || 
                                         hostname.endsWith('.localhost');
                        
                        let baseUrl = '/';
                        const subdomain = market.subdomain;
                        
                        if (subdomain) {
                          if (isLocal) {
                            if (hostname.startsWith('192.168.') || hostname === 'localhost' || hostname === '127.0.0.1') {
                              baseUrl = `${window.location.protocol}//${window.location.host}/?platform=mobile&tenantId=${market.id}`;
                            } else {
                              baseUrl = `${window.location.protocol}//${subdomain}.${hostname.includes('.localhost') ? 'localhost:8080' : hostname}?platform=mobile&tenantId=${market.id}`;
                            }
                          } else {
                            // Production fallback logic
                            const suffix = hostname.endsWith('.saeaa.net') ? 'saeaa.net' : 'saeaa.com';
                            baseUrl = `${window.location.protocol}//${subdomain}.${suffix}?platform=mobile&tenantId=${market.id}`;
                          }
                        } else {
                          baseUrl = `/?platform=mobile&tenantId=${market.id}`;
                        }

                        const width = 375;
                        const height = 812;
                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;

                        window.open(baseUrl, `MobilePreview-${market.id}`, `width=${width},height=${height},left=${left},top=${top},resizable=yes`);
                      }}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>{isRTL ? 'تطبيق الجوال' : 'تطبيق'}</span>
                    </Button>

                    {/* Delete Button */}
                    {market.isOwner && !isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-full col-span-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all gap-1.5 text-[9px]"
                        onClick={(e) => handleDeleteClick(e, market)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{isRTL ? 'حذف المتجر' : 'Delete Market'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        {/* Create New Store */}
        {canCreate.allowed ? (
          <DropdownMenuItem 
            onClick={handleCreateStore} 
            className="cursor-pointer mx-1 my-1 rounded-md"
          >
            <div className="flex items-center gap-2 text-primary">
              <div className="h-8 w-8 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-medium">{t('marketSetup.createStore', 'إنشاء متجر جديد')}</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <div className="px-3 py-2 text-center">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>{t('dashboard.storeLimitReached', 'تم الوصول للحد الأقصى')}</span>
            </div>
            <Link to="/dashboard/settings/billing" className="text-xs text-primary hover:underline mt-1 block">
              {t('dashboard.upgradePlan', 'ترقية الخطة')}
            </Link>
          </div>
        )}
      </DropdownMenuContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'حذف المتجر' : 'Delete Market'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? `هل أنت متأكد من حذف المتجر "${marketToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة به.`
                : `Are you sure you want to delete the market "${marketToDelete?.name}"? This action cannot be undone and will delete all associated data.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isRTL ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                isRTL ? 'حذف' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}

