import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Key, Calendar, ExternalLink } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function MobileDigitalKeys() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Mock data
  const [keys, setKeys] = useState<any[]>([
    { id: '1235', title: 'Digital Key', purchaseDate: 'Jan 30, 2026', code: 'XXXX-XXXX-XXXX-1235', status: 'Active' },
    { id: '1236', title: 'Digital Key', purchaseDate: 'Jan 30, 2026', code: 'XXXX-XXXX-XXXX-1236', status: 'Active' },
    { id: '1237', title: 'Digital Key', purchaseDate: 'Jan 30, 2026', code: 'XXXX-XXXX-XXXX-1237', status: 'Active' },
    { id: '1238', title: 'Digital Key', purchaseDate: 'Jan 30, 2026', code: 'XXXX-XXXX-XXXX-1238', status: 'Active' },
  ]);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  const primaryColor = activeConfig?.primaryColor || '#000000';

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
             <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('profile.digitalKeys', 'Digital Keys')}</h1>
      </div>

      <div className="p-4 space-y-4">
          {keys.map((key) => (
             <div key={key.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                     <Key size={20} />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-foreground truncate">{key.title}</h3>
                     <p className="text-xs text-muted-foreground font-mono mt-1">#{key.id}</p>
                     <p className="text-[10px] text-muted-foreground mt-1 uppercase">PURCHASED: {key.purchaseDate}</p>
                 </div>
                 
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary"
                    style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
                 >
                    {t('common.details', 'Details')}
                 </Button>
             </div>
          ))}
      </div>
    </div>
  );
}

function ArrowIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}
