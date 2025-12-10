import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Handshake, 
  ToggleLeft, 
  DollarSign, 
  Webhook, 
  Plug, 
  Settings, 
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Import sub-pages
import MasterOverview from './master-dashboard/Overview';
import TenantManagement from './master-dashboard/TenantManagement';
import PaymentGatewayManager from './master-dashboard/PaymentGatewayManager';
import PartnerManager from './master-dashboard/PartnerManager';
import FeatureFlagManager from './master-dashboard/FeatureFlagManager';
import PaymentPlanManager from './master-dashboard/PaymentPlanManager';
import WebhookManager from './master-dashboard/WebhookManager';
import IntegrationManager from './master-dashboard/IntegrationManager';
import PlatformSettings from './master-dashboard/PlatformSettings';
import PlatformAnalytics from './master-dashboard/PlatformAnalytics';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  component: any;
}

const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: MasterOverview },
  { id: 'tenants', label: 'Tenants', icon: Users, component: TenantManagement },
  { id: 'gateways', label: 'Payment Gateways', icon: CreditCard, component: PaymentGatewayManager },
  { id: 'partners', label: 'Partners', icon: Handshake, component: PartnerManager },
  { id: 'features', label: 'Feature Flags', icon: ToggleLeft, component: FeatureFlagManager },
  { id: 'plans', label: 'Payment Plans', icon: DollarSign, component: PaymentPlanManager },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, component: WebhookManager },
  { id: 'integrations', label: 'Integrations', icon: Plug, component: IntegrationManager },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: PlatformAnalytics },
  { id: 'settings', label: 'Platform Settings', icon: Settings, component: PlatformSettings },
];

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await coreApi.get('/auth/me');
      if (response.data.role !== 'SUPER_ADMIN') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the Master Dashboard',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }
      setUser(response.data);
    } catch (error) {
      console.error('Access check failed:', error);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || MasterOverview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Master Dashboard</h1>
                <p className="text-xs text-gray-400">Platform Administration</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
              <p className="text-xs text-purple-400">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-gray-800/30 backdrop-blur-sm border-r border-gray-700 transition-all duration-300 overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
