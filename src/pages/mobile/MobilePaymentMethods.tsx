import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Trash2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function MobilePaymentMethods() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Mock data
  const [cards, setCards] = useState<any[]>([
    { id: 1, type: 'visa', last4: '4242', expiry: '12/30', holder: 'JOHN DOE', bg: 'bg-gray-900' }
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
          <h1 className="text-lg font-bold text-foreground">{t('profile.paymentMethods', 'Payment Methods')}</h1>
      </div>

      <div className="p-4 space-y-4">
          {cards.map((card) => (
             <div key={card.id} className={`${card.bg} text-white p-6 rounded-2xl shadow-lg relative overflow-hidden aspect-[1.58/1]`}>
                 {/* Decorative Circles */}
                 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                 
                 <div className="relative z-10 flex flex-col justify-between h-full">
                     <div className="flex justify-between items-start">
                         <ChipIcon className="w-10 h-8 text-yellow-500/80" />
                         <span className="font-bold text-lg italic tracking-wider">VISA</span>
                     </div>
                     
                     <div className="text-xl tracking-[0.2em] font-mono mt-4 mb-4">
                         **** **** **** {card.last4}
                     </div>
                     
                     <div className="flex justify-between items-end">
                         <div>
                             <span className="text-[10px] text-white/70 block mb-1">CARD HOLDER</span>
                             <span className="font-medium tracking-wide text-sm">{card.holder}</span>
                         </div>
                         <div>
                             <span className="text-[10px] text-white/70 block mb-1">EXPIRES</span>
                             <span className="font-medium tracking-wide text-sm">{card.expiry}</span>
                         </div>
                     </div>
                 </div>
                 
                 <button className="absolute top-4 right-4 text-white/50 hover:text-white p-1">
                     <Trash2 size={16} />
                 </button>
             </div>
          ))}
          
          <button className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground font-medium hover:bg-muted active:bg-muted/80 transition-colors">
              <Plus size={20} />
              {t('common.addCard', 'Add New Card')}
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

function ChipIcon(props: any) {
    return (
       <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
         <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
         <path d="M6 9h2v6H6V9zm4 0h2v6h-2V9zm4 0h2v6h-2V9zm4 0h2v6h-2V9z" fillOpacity="0.5"/>
         <path d="M2 9h4v6H2zM18 9h4v6h-4z" fill="none"/>
       </svg>
    )
}
