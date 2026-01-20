import { useState, useEffect } from 'react';
import { Store, Plus, Check, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export default function MarketSelector() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [marketLimit, setMarketLimit] = useState({ limit: 1, currentCount: 0 });
  const { user, refreshUser, loginWithTokens } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMarkets();
    checkCanCreateMarket();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await authService.getUserMarkets();
      setMarkets(data || []);
    } catch (error) {
      console.error('Failed to load markets:', error);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreateMarket = async () => {
    try {
      const result = await authService.canCreateMarket();
      setCanCreate(result.allowed);
      setMarketLimit({ limit: result.limit, currentCount: result.currentCount });
    } catch (error) {
      console.error('Failed to check market limit:', error);
      setCanCreate(false);
    }
  };

  const handleSwitchMarket = async (marketId: string) => {
    if (switching) return;
    
    try {
      setSwitching(true);
      const result = await authService.switchStore(marketId);
      
      if (result.accessToken && result.refreshToken) {
        // Use loginWithTokens to properly synchronize tokens and user state
        await loginWithTokens(result.accessToken, result.refreshToken);
        
        toast({
          title: 'تم التبديل بنجاح',
          description: `تم التبديل إلى ${result.tenantName || 'المتجر'}`,
        });
        
        // Reload to refresh all data with the new tenant context
        window.location.reload();
      } else {
        throw new Error('Failed to obtain new session tokens');
      }
    } catch (error: any) {
      toast({
        title: 'فشل التبديل',
        description: error.message || 'حدث خطأ أثناء تبطيل المتجر',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  // If no markets exist, show full setup prompt
  if (!loading && markets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">مرحباً بك في لوحة التحكم!</CardTitle>
            <CardDescription className="text-base">
              لم تقم بإعداد متجرك بعد. دعنا نبدأ بإنشاء متجرك الإلكتروني
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطوة واحدة فقط!</AlertTitle>
              <AlertDescription>
                قم بإكمال إعداد متجرك لتتمكن من إضافة المنتجات وبدء البيع
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold">ما الذي ستحصل عليه:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>متجر إلكتروني احترافي بنطاق خاص</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>لوحة تحكم كاملة لإدارة المنتجات والطلبات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>قوالب جاهزة قابلة للتخصيص</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>تحليلات وتقارير مفصلة</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/setup" className="flex-1">
                <Button size="lg" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إنشاء متجر جديد
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If markets exist but none is selected, show market selection
  const activeMarket = markets.find(m => m.isActive);
  const hasValidMarket = activeMarket && user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system';

  if (!hasValidMarket && markets.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">اختر المتجر</CardTitle>
            <CardDescription className="text-base">
              لديك {markets.length} متجر. اختر المتجر الذي تريد العمل عليه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-2">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      market.isActive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleSwitchMarket(market.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{market.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {market.subdomain}.saeaa.com
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {market.isActive ? (
                        <div className="flex items-center gap-2">
                           <Badge variant="default" className="bg-primary hover:bg-primary">
                            نشط
                          </Badge>
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={switching}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchMarket(market.id);
                          }}
                        >
                          {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تنشيط'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {canCreate && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    المتاجر: {marketLimit.currentCount} / {marketLimit.limit}
                  </span>
                </div>
                <Link to="/setup">
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    إنشاء متجر جديد
                  </Button>
                </Link>
              </div>
            )}

            {!canCreate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>تم الوصول للحد الأقصى</AlertTitle>
                <AlertDescription>
                  لديك {marketLimit.currentCount} من {marketLimit.limit} متجر. قم بترقية خطتك لإنشاء المزيد من المتاجر.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Return null if everything is fine (component shouldn't render in this case)
  return null;
}

// Compact dropdown version for header/navbar
export function MarketSelectorDropdown() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [marketLimit, setMarketLimit] = useState({ limit: 1, currentCount: 0 });
  const { user, refreshUser, loginWithTokens } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMarkets();
    checkCanCreateMarket();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await authService.getUserMarkets();
      setMarkets(data || []);
    } catch (error) {
      console.error('Failed to load markets:', error);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreateMarket = async () => {
    try {
      const result = await authService.canCreateMarket();
      setCanCreate(result.allowed);
      setMarketLimit({ limit: result.limit, currentCount: result.currentCount });
    } catch (error) {
      console.error('Failed to check market limit:', error);
      setCanCreate(false);
    }
  };

  const handleSwitchMarket = async (marketId: string) => {
    if (switching) return;
    
    try {
      setSwitching(true);
      const result = await authService.switchStore(marketId);
      
      if (result.accessToken && result.refreshToken) {
        await loginWithTokens(result.accessToken, result.refreshToken);
        
        toast({
          title: 'تم التبديل بنجاح',
          description: `تم التبديل إلى ${result.tenantName || 'المتجر'}`,
        });
        
        // Reload to refresh all data with the new tenant context
        window.location.reload();
      } else {
        throw new Error('Failed to obtain new session tokens');
      }
    } catch (error: any) {
      toast({
        title: 'فشل التبديل',
        description: error.message || 'حدث خطأ أثناء تبديل المتجر',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const activeMarket = markets.find(m => m.isActive);
  const hasValidMarket = activeMarket && user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system';

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        جاري التحميل...
      </Button>
    );
  }

  // If no markets exist, redirect to setup when clicked
  if (markets.length === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => navigate('/setup')}
      >
        <Plus className="h-4 w-4" />
        <span className="max-w-[150px] truncate">
          إنشاء متجر
        </span>
      </Button>
    );
  }

  // If markets exist but none is active/valid, show dropdown with option to create
  if (!hasValidMarket && markets.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="max-w-[150px] truncate">
              اختر متجر
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <div className="p-2 text-xs text-muted-foreground border-b">
            المتاجر ({marketLimit.currentCount}/{marketLimit.limit})
          </div>
          <ScrollArea className="h-[200px]">
            {markets.map((market) => (
              <DropdownMenuItem
                key={market.id}
                onClick={() => handleSwitchMarket(market.id)}
                className="flex items-center justify-between cursor-pointer"
                disabled={switching}
              >
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{market.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {market.subdomain}
                    </div>
                  </div>
                </div>
                {market.isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
          {canCreate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/setup" className="flex items-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  إنشاء متجر جديد
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Normal dropdown when market exists and is active
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Store className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {activeMarket?.name || 'اختر متجر'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <div className="p-2 text-xs text-muted-foreground border-b">
          المتاجر ({marketLimit.currentCount}/{marketLimit.limit})
        </div>
        <ScrollArea className="h-[200px]">
          {markets.map((market) => (
            <DropdownMenuItem
              key={market.id}
              onClick={() => handleSwitchMarket(market.id)}
              className="flex items-center justify-between cursor-pointer"
              disabled={switching}
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <div>
                  <div className="font-medium">{market.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {market.subdomain}
                  </div>
                </div>
              </div>
              {market.isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        {canCreate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/setup" className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                إنشاء متجر جديد
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

