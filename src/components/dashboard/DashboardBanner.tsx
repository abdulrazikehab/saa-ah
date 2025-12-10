import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';

export default function DashboardBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkCompletion = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await coreApi.get(`/partner/status`, { requireAuth: true });
        
        if (response?.asusPartnerCompleted) {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Partner status check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompletion();
  }, [user?.id]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Just hide temporarily for this session
  };

  const handleStartProcess = () => {
    // Hide the banner when starting the process
    setIsVisible(false);
    // Completion will be tracked on backend when marketplace is created
  };

  if (isLoading || !isVisible) return null;

  return (
    <div className="mb-6 relative group">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 left-2 z-10 text-white/80 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <img 
                  src="/partners/asus-logo.png" 
                  alt="ASUS" 
                  className="w-12 h-12"
                />
              </div>
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1">منتجات ASUS - أسس</h3>
                <p className="text-white/90 text-sm">بطاقات الألعاب، شدات PUBG، وبطاقات PlayStation</p>
              </div>
            </div>
            <Link to="/partner" onClick={handleStartProcess}>
              <Button 
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-xl"
              >
                ابدأ الآن
                <Package className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
