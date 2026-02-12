import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import type { AppNotification } from '@/services/types';
import { coreApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function MobileNotifications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<{ primaryColor?: string } | null>(null);

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setAppConfig(res.config || res)).catch(() => {});
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const primaryColor = appConfig?.primaryColor || '#000000';
  const isArabic = i18n.language && i18n.language.startsWith('ar');

  if (isLoading) return <div className="p-8 text-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" style={{ borderBottomColor: primaryColor }}></div></div>;

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
               <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{t('notifications.title', 'Notifications')}</h1>
          </div>
          {notifications.some(n => !n.readAt) && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
            >
              {t('notifications.markAllRead', 'Mark all as read')}
            </button>
          )}
      </div>

      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground">
               <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
               <p className="mb-4">{t('notifications.empty', 'No notifications yet')}</p>
             </div>
        ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-2xl shadow-sm border border-border transition-all ${!notification.readAt ? 'ring-1 bg-card/50' : 'bg-card'}`}
                style={{ 
                  boxShadow: !notification.readAt ? `0 0 0 1px ${primaryColor}33` : undefined, 
                  backgroundColor: !notification.readAt ? `${primaryColor}08` : undefined
                }}
                onClick={() => {
                  if (!notification.readAt) handleMarkAsRead(notification.id);
                  if (notification.data?.url) navigate(notification.data.url);
                  else if (notification.type === 'ORDER' && notification.data?.orderId) navigate(`/orders/${notification.data.orderId}`);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${!notification.readAt ? 'text-white shadow-md' : 'bg-muted text-muted-foreground'}`} style={{ backgroundColor: !notification.readAt ? primaryColor : undefined }}>
                    <Bell size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                       <h3 className={`font-bold text-sm truncate ${!notification.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                         {isArabic ? (notification.titleAr || notification.titleEn) : notification.titleEn}
                       </h3>
                       <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                         {formatDistanceToNow(new Date(notification.createdAt), { 
                           addSuffix: true, 
                           locale: isArabic ? ar : enUS 
                         })}
                       </span>
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${!notification.readAt ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                      {isArabic ? (notification.bodyAr || notification.bodyEn) : notification.bodyAr || notification.bodyEn}
                    </p>
                    
                    {!notification.readAt && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-primary/30 text-primary" style={{ borderColor: `${primaryColor}4D`, color: primaryColor }}>
                          {t('notifications.new', 'New')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}
