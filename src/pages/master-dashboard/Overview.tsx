import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Store,
  CreditCard,
  Handshake,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { getAdminApiKey } from '@/lib/admin-config';

interface PlatformOverview {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  transactions: {
    total: number;
    totalRevenue: number;
    platformFees: number;
  };
  planDistribution: Array<{
    plan: string;
    count: number;
  }>;
  activePaymentGateways: number;
  activePartners: number;
  totalUsers: number;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
  }>;
}

export default function MasterOverview() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    try {
      const response = await coreApi.get('/admin/master/overview', { requireAuth: true, adminApiKey: getAdminApiKey() });
      setOverview(response);
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center text-gray-400 py-12">
        Failed to load platform overview
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tenants',
      value: overview.tenants.total,
      icon: Store,
      color: 'purple',
      subtitle: `${overview.tenants.active} active`,
    },
    {
      title: 'Total Revenue',
      value: `$${(overview.transactions.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      subtitle: `$${(overview.transactions.platformFees || 0).toLocaleString()} platform fees`,
    },
    {
      title: 'Transactions',
      value: overview.transactions.total.toLocaleString(),
      icon: TrendingUp,
      color: 'blue',
      subtitle: 'All time',
    },
    {
      title: 'Total Users',
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      color: 'orange',
      subtitle: 'Across all tenants',
    },
    {
      title: 'Payment Gateways',
      value: overview.activePaymentGateways,
      icon: CreditCard,
      color: 'pink',
      subtitle: 'Active',
    },
    {
      title: 'Partners',
      value: overview.activePartners,
      icon: Handshake,
      color: 'indigo',
      subtitle: 'Active',
    },
  ];

  const getStatusIcon = (action: string) => {
    if (action.includes('CREATED')) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (action.includes('DELETED')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (action.includes('SUSPENDED')) return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    return <Activity className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Platform Overview</h2>
        <p className="text-gray-400">Monitor your entire platform at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
            green: 'from-green-500/20 to-green-600/20 border-green-500/30',
            blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
            pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
            indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
          }[stat.color];

          const iconColorClasses = {
            purple: 'text-purple-400',
            green: 'text-green-400',
            blue: 'text-blue-400',
            orange: 'text-orange-400',
            pink: 'text-pink-400',
            indigo: 'text-indigo-400',
          }[stat.color];

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${colorClasses} border backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-transform duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-800/50 ${iconColorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-gray-400">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Tenant Status */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Tenant Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{overview.tenants.active}</span>
            </div>
            <p className="text-sm text-gray-400">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{overview.tenants.suspended}</span>
            </div>
            <p className="text-sm text-gray-400">Suspended</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-white">{overview.tenants.inactive}</span>
            </div>
            <p className="text-sm text-gray-400">Inactive</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{overview.tenants.total}</span>
            </div>
            <p className="text-sm text-gray-400">Total</p>
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Plan Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview.planDistribution.map((plan, index) => (
            <div key={index} className="bg-gray-700/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">{plan.plan}</p>
              <p className="text-2xl font-bold text-white">{plan.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {overview.recentActivity.length > 0 ? (
            overview.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                {getStatusIcon(activity.action)}
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-400">{activity.resource}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
