import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function MobileAddresses() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // Mock addresses since backend endpoint might differ or not exist yet
  const [addresses, setAddresses] = useState<any[]>([
    { id: 1, type: 'Home', address: 'Business Way, Tech Park 123, Silicon Valley, CA 94025', isDefault: true },
    { id: 2, type: 'Office', address: 'Corporate Blvd, Suite 100 456, Downtown, NY 10001', isDefault: false },
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
          <h1 className="text-lg font-bold text-foreground">{t('profile.addresses', 'Shipping Addresses')}</h1>
      </div>

      <div className="p-4 space-y-4">
          {addresses.map((addr) => (
             <div key={addr.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                 <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${addr.isDefault ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`} style={{ color: addr.isDefault ? primaryColor : undefined, backgroundColor: addr.isDefault ? `${primaryColor}20` : undefined }}>
                            {addr.type === 'Home' ? <Home size={18} /> : <Briefcase size={18} />}
                        </div>
                        <h3 className="font-bold text-foreground">{addr.type}</h3>
                        {addr.isDefault && <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-medium" style={{ color: primaryColor, backgroundColor: `${primaryColor}20` }}>Default</span>}
                     </div>
                     <div className="flex gap-2">
                        <button className="text-muted-foreground hover:text-foreground"><Edit2 size={16} /></button>
                        <button className="text-muted-foreground hover:text-red-500"><Trash2 size={16} /></button>
                     </div>
                 </div>
                 <p className="text-sm text-foreground/80 leading-relaxed pl-11 rtl:pr-11 rtl:pl-0">
                     {addr.address}
                 </p>
             </div>
          ))}
          
          <button className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground font-medium hover:bg-muted active:bg-muted/80 transition-colors">
              <Plus size={20} />
              {t('common.addNewAddress', 'Add New Address')}
          </button>
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
