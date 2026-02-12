import React from 'react';
import { 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Palette,
  Settings,
  Store,
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  LayoutDashboard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

interface StaticDashboardPreviewProps {
  mobile?: boolean;
  isDark?: boolean;
}

// Optimized static dashboard for preview frames
// "Mobile" optimized for ~250px width
// "Desktop" optimized for ~700px width
export const StaticDashboardPreview = ({ mobile, isDark = true }: StaticDashboardPreviewProps) => {
  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  // Colors based on theme
  const colors = {
    bg: isDark ? "bg-slate-950" : "bg-white",
    text: isDark ? "text-slate-50" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    textDim: isDark ? "text-slate-600" : "text-slate-400",
    cardBg: isDark ? "bg-white/5" : "bg-slate-50 border-slate-100",
    border: isDark ? "border-white/10" : "border-slate-200",
    inputBg: isDark ? "bg-white/5" : "bg-white",
    hoverBg: isDark ? "hover:bg-white/5" : "hover:bg-slate-100",
    primaryLight: isDark ? "bg-primary/20" : "bg-primary/10",
  };

  const ChartGradient = ({ id, color }: { id: string, color: string }) => (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
        <stop offset="95%" stopColor={color} stopOpacity={0}/>
      </linearGradient>
    </defs>
  );

  if (mobile) {
    // Mobile Layout - Optimized for 250px width
    return (
      <div className={cn("w-full h-full flex flex-col overflow-hidden text-[10px]", colors.bg, colors.text)} dir="rtl">
        {/* Header */}
        <div className={cn("flex items-center justify-between px-3 py-2 border-b h-10 shrink-0", colors.border)}>
          <Menu className={cn("w-3.5 h-3.5", colors.textMuted)} />
          <div className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded flex items-center justify-center", colors.primaryLight)}>
              <Store className="w-2.5 h-2.5 text-primary" />
            </div>
            <span className="font-bold text-[10px]">كون</span>
          </div>
          <Bell className={cn("w-3.5 h-3.5", colors.textMuted)} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-2">
          {/* Stats Row */}
          <div className="flex gap-2 mb-2 w-full">
            {/* Revenue */}
             <div className={cn("flex-1 rounded-lg p-2 border flex flex-col justify-between min-w-0", colors.cardBg, colors.border)}>
              <div className="flex items-start justify-between mb-1">
                <div className="p-1 bg-green-500/10 rounded">
                  <DollarSign className="w-2.5 h-2.5 text-green-500" />
                </div>
              </div>
              <div>
                <span className={cn("block text-[8px] truncate", colors.textMuted)}>المبيعات</span>
                <span className="block font-bold text-[10px]">12K</span>
              </div>
            </div>

            {/* Orders */}
             <div className={cn("flex-1 rounded-lg p-2 border flex flex-col justify-between min-w-0", colors.cardBg, colors.border)}>
              <div className="flex items-start justify-between mb-1">
                <div className="p-1 bg-orange-500/10 rounded">
                  <ShoppingCart className="w-2.5 h-2.5 text-orange-500" />
                </div>
              </div>
              <div>
                <span className={cn("block text-[8px] truncate", colors.textMuted)}>الطلبات</span>
                <span className="block font-bold text-[10px]">345</span>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div className={cn("rounded-lg p-2 border mb-2", colors.cardBg, colors.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-[8px] font-medium", colors.textMuted)}>الأداء</span>
            </div>
            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <ChartGradient id="mobileGrad" color="#3b82f6" />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} fill="url(#mobileGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* List Items */}
          <div className="space-y-1.5">
             {[1, 2, 3].map((_, i) => (
                <div key={i} className={cn("rounded-lg p-1.5 border flex items-center justify-between", colors.cardBg, colors.border)}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-500/10 flex items-center justify-center text-[8px]">
                      {['أ', 'س', 'خ'][i]}
                    </div>
                    <div>
                      <div className="font-bold text-[8px]">عميل {i+1}</div>
                      <div className={cn("text-[7px]", colors.textDim)}>منتج تجريبي</div>
                    </div>
                  </div>
                  <div className="text-[8px] font-medium text-green-500">+20 ر.س</div>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout - Optimized for 700px width
  return (
    <div className={cn("w-full h-full flex overflow-hidden text-[10px]", colors.bg, colors.text)} dir="rtl">
      {/* Sidebar - Compact 120px */}
      <div className={cn("w-32 h-full flex flex-col border-l shrink-0", colors.cardBg, colors.border)}>
        {/* Logo */}
        <div className={cn("flex items-center gap-2 p-3 border-b h-12", colors.border)}>
          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", colors.primaryLight)}>
            <Store className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[11px] truncate">كون</p>
          </div>
        </div>

        {/* Nav Items - Compact */}
        <div className="flex-1 p-2 space-y-0.5">
          {[
            { icon: LayoutDashboard, label: 'الرئيسية', active: true },
            { icon: ShoppingCart, label: 'الطلبات' },
            { icon: Package, label: 'المنتجات' },
            { icon: Users, label: 'العملاء' },
            { icon: BarChart3, label: 'التقارير' },
          ].map((item, i) => (
            <div key={i} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent", item.active ? colors.primaryLight + " text-primary" : "text-slate-500 hover:bg-slate-500/5")}>
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </div>
          ))}
          
          <div className={cn("my-2 border-t", colors.border)} />
          
          {[
            { icon: Palette, label: 'المظهر' },
            { icon: Settings, label: 'الإعدادات' },
          ].map((item, i) => (
            <div key={i} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent text-slate-500 hover:bg-slate-500/5")}>
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </div>
          ))}
        </div>
        
        {/* User - Compact */}
        <div className={cn("p-2 border-t", colors.border)}>
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[8px]">A</div>
             <div className="min-w-0">
               <p className="font-bold text-[9px] truncate">Admin</p>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={cn("h-12 border-b flex items-center justify-between px-4 shrink-0", colors.border)}>
          <div className="relative w-48">
             <Search className={cn("absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3", colors.textMuted)} />
             <input className={cn("w-full h-7 rounded-lg text-[10px] pr-7 pl-2 border outline-none", colors.inputBg, colors.border, colors.textDim)} placeholder="بحث..." />
          </div>
          <div className="flex items-center gap-2">
            {isDark ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-slate-400" />}
            <Bell className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
            {/* Stats Cards */}
            {[
              { label: 'المبيعات', val: '12,450', icon: DollarSign, color: 'text-green-500', trend: '+12%' },
              { label: 'الطلبات', val: '345', icon: ShoppingCart, color: 'text-orange-500', trend: '+8%' },
              { label: 'العملاء', val: '876', icon: Users, color: 'text-blue-500', trend: '+5%' },
            ].map((stat, i) => (
              <div key={i} className={cn("rounded-xl p-3 border shadow-sm", colors.cardBg, colors.border)}>
                <div className="flex justify-between items-start mb-2">
                  <div className={cn("p-1.5 rounded-lg bg-current/10", stat.color.replace('text-', 'bg-').split(' ')[0] + '/10')}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{stat.trend}</span>
                </div>
                <div>
                  <p className={cn("text-[9px]", colors.textMuted)}>{stat.label}</p>
                  <p className="text-lg font-bold leading-tight">{stat.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
            {/* Chart Area */}
            <div className={cn("col-span-2 rounded-xl p-3 border shadow-sm flex flex-col", colors.cardBg, colors.border)}>
               <div className="flex justify-between items-center mb-2 shrink-0">
                 <h3 className="font-bold text-[11px]">نظرة عامة</h3>
                 <div className={cn("text-[9px] px-2 py-0.5 rounded border", colors.border)}>آخر 7 أيام</div>
               </div>
               <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <ChartGradient id="desktopGrad" color="#3b82f6" />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#desktopGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Recent Orders List */}
            <div className={cn("rounded-xl p-3 border shadow-sm flex flex-col", colors.cardBg, colors.border)}>
              <h3 className="font-bold text-[11px] mb-3 shrink-0">آخر الطلبات</h3>
              <div className="flex-1 overflow-auto space-y-2 pr-1">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center font-bold text-[9px]", colors.primaryLight)}>
                        {['A', 'S', 'K', 'M'][i]}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold">اسم العميل</p>
                        <p className={cn("text-[8px]", colors.textDim)}>منذ ساعة</p>
                      </div>
                    </div>
                    <span className="font-bold text-[9px]">{200 + i*50} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
