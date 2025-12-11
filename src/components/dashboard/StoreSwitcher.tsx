import { useState, useEffect } from 'react';
import { Store, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const { t } = useTranslation();
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
      setMarkets(marketsData);
      setCanCreate(canCreateData);
    } catch (error) {
      console.error('Failed to load markets:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load stores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchStore = async (tenantId: string) => {
    if (switching) return;
    
    try {
      setSwitching(true);
      await authService.switchStore(tenantId);
      
      // Refresh user data to get new tenantId
      await refreshUser();
      
      toast({
        title: t('common.success'),
        description: 'Store switched successfully',
      });
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to switch store:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to switch store',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateStore = () => {
    navigate('/dashboard/market-setup');
  };

  const currentMarket = markets.find(m => m.id === user?.tenantId) || markets[0];

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin ml-2" />
        {t('common.loading')}
      </Button>
    );
  }

  if (markets.length === 0) {
    return (
      <Button variant="outline" size="sm" onClick={handleCreateStore}>
        <Plus className="h-4 w-4 ml-2" />
        {t('marketSetup.createStore', 'Create Store')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={switching}>
          {switching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <Store className="h-4 w-4 ml-2" />
              {currentMarket?.name || 'Select Store'}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('dashboard.stores', 'My Stores')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {markets.map((market) => (
          <DropdownMenuItem
            key={market.id}
            onClick={() => handleSwitchStore(market.id)}
            className="flex items-center justify-between cursor-pointer"
            disabled={switching || market.id === user?.tenantId}
          >
            <div className="flex items-center gap-2 flex-1">
              <Store className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{market.name}</div>
                <div className="text-xs text-muted-foreground">{market.subdomain}</div>
              </div>
            </div>
            {market.id === user?.tenantId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {canCreate.allowed && (
          <DropdownMenuItem onClick={handleCreateStore} className="cursor-pointer">
            <Plus className="h-4 w-4 ml-2" />
            {t('marketSetup.createStore', 'Create New Store')}
          </DropdownMenuItem>
        )}
        {!canCreate.allowed && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            {t('dashboard.storeLimitReached', 'Store limit reached')} ({canCreate.currentCount}/{canCreate.limit})
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

