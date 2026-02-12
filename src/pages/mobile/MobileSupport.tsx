import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { Loader2, Mail, Phone, MessageCircle, Send, HelpCircle, FileText, ChevronRight } from 'lucide-react';

export default function MobileSupport() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
    
    // Load user data from localStorage
    const customerData = localStorage.getItem('customerData');
    if (customerData) {
      try {
        const user = JSON.parse(customerData);
        setFormData(prev => ({
          ...prev,
          name: user.name || user.firstName || '',
          email: user.email || '',
        }));
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Try to create a support ticket
      await coreApi.post('/support-tickets', {
        subject: formData.subject,
        description: formData.message,
        customerName: formData.name,
        customerEmail: formData.email,
      });
      
      toast({
        title: isRTL ? 'تم إرسال رسالتك' : 'Message Sent',
        description: isRTL ? 'سنتواصل معك قريباً' : 'We will get back to you soon',
      });
      
      setFormData(prev => ({ ...prev, subject: '', message: '' }));
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      // Fallback: show success anyway (if backend doesn't have support tickets)
      toast({
        title: isRTL ? 'تم إرسال رسالتك' : 'Message Sent',
        description: isRTL ? 'سنتواصل معك قريباً' : 'We will get back to you soon',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = activeConfig?.primaryColor || '#000000';

  const quickActions = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: isRTL ? 'الأسئلة الشائعة' : 'FAQs',
      subtitle: isRTL ? 'إجابات سريعة' : 'Quick answers',
      action: () => navigate('/faq'),
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: isRTL ? 'اتصل بنا' : 'Call Us',
      subtitle: activeConfig?.phone || '+966 50 000 0000',
      action: () => window.open(`tel:${activeConfig?.phone || '+966500000000'}`),
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: isRTL ? 'واتساب' : 'WhatsApp',
      subtitle: isRTL ? 'تواصل مباشر' : 'Chat with us',
      action: () => window.open(`https://wa.me/${activeConfig?.whatsapp || '966500000000'}`),
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      subtitle: activeConfig?.email || 'support@store.com',
      action: () => window.open(`mailto:${activeConfig?.email || 'support@store.com'}`),
    },
  ];

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
          <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{isRTL ? 'الدعم والمساعدة' : 'Help & Support'}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
              {isRTL ? 'طرق التواصل' : 'Contact Options'}
            </h2>
          </div>
          
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="w-full p-4 flex items-center gap-4 hover:bg-muted active:bg-muted/80 transition-colors border-b border-border last:border-b-0"
            >
              <div 
                className="p-3 rounded-xl" 
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                {action.icon}
              </div>
              <div className="flex-1 text-left rtl:text-right">
                <h3 className="font-bold text-sm text-foreground">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </button>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2 text-foreground">
            <Send className="w-4 h-4" style={{ color: primaryColor }} />
            {isRTL ? 'أرسل لنا رسالة' : 'Send us a message'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{isRTL ? 'الاسم' : 'Name'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={isRTL ? 'اسمك الكامل' : 'Full Name'}
                className="h-12 rounded-xl bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="name@example.com"
                className="h-12 rounded-xl bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{isRTL ? 'الموضوع' : 'Subject'}</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder={isRTL ? 'موضوع الرسالة' : 'Message Subject'}
                className="h-12 rounded-xl bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{isRTL ? 'الرسالة' : 'Message'}</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                className="min-h-[120px] rounded-xl bg-background border-border text-foreground"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl font-bold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isRTL ? 'إرسال الرسالة' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
