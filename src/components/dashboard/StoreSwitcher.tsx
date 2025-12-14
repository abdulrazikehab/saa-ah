import { useState, useEffect } from 'react';
import { Store, Plus, Check, Loader2, ChevronDown, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [canCreate, setCanCreate] = useState({ allowed: false, currentCount: 0, limit: 1 });

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
      const result = await authService.switchStore(tenantId);
      
      // Store the new tokens returned from the switch
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      
      // Refresh user data to get new tenantId
      await refreshUser();
      
      toast({
        title: t('common.success'),
        description: `${t('dashboard.storeSwitched', 'Switched to')} ${result.tenantName || 'store'}`,
      });
      
      // Reload the page to refresh all data with the new tenant context
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to switch store:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('dashboard.switchFailed', 'Failed to switch store'),
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateStore = () => {
    navigate('/setup');
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

  // No markets - show create button
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
          className="gap-2 min-w-[140px] justify-between"
        >
          {switching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">{t('common.switching', 'جاري التبديل...')}</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Store className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="max-w-[100px] truncate font-medium">
                  {currentMarket?.name || t('dashboard.selectStore', 'اختر متجر')}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-[280px]">
        {/* Header with count */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            {t('dashboard.stores', 'متاجري')}
          </DropdownMenuLabel>
          <Badge variant="secondary" className="text-xs">
            {canCreate.currentCount}/{canCreate.limit}
          </Badge>
        </div>
        
        {/* Scrollable Markets List */}
        <ScrollArea className="max-h-[240px]">
          <div className="py-1">
            {markets.map((market) => {
              const isActive = market.id === user?.tenantId;
              return (
                <DropdownMenuItem
                  key={market.id}
                  onClick={() => handleSwitchStore(market.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer mx-1 my-0.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                  disabled={switching}
                >
                  {/* Store Icon */}
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <Store className="h-4 w-4" />
                  </div>
                  
                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{market.name}</span>
                      {market.isOwner && (
                        <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" title="مالك" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">
                        {market.subdomain}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 ${getPlanBadge(market.plan)}`}>
                        {market.plan}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
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
    </DropdownMenu>
  );
}

