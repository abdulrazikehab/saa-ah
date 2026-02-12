import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ContactUs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(isRTL ? 'تم إرسال رسالتك بنجاح' : 'Your message has been sent successfully');
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      value: 'support@saeaa.com',
      link: 'mailto:support@saeaa.com'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: isRTL ? 'الهاتف' : 'Phone',
      value: '+966 50 000 0000',
      link: 'tel:+966500000000'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: isRTL ? 'العنوان' : 'Address',
      value: isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
      link: '#'
    }
  ];

  return (
    <PlatformLayout>
      {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {isRTL ? 'تواصل معنا' : 'Contact Us'}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو اقتراح.'
                  : 'We are here to help. Contact us for any inquiries or suggestions.'}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-6">
                    {isRTL ? 'معلومات التواصل' : 'Contact Information'}
                  </h2>
                  <p className="text-muted-foreground mb-8 text-lg">
                    {isRTL
                      ? 'فريق خدمة العملاء متواجد على مدار الساعة للإجابة على استفساراتكم.'
                      : 'Our customer service team is available around the clock to answer your inquiries.'}
                  </p>
                </div>

                <div className="grid gap-6">
                  {contactInfo.map((item, index) => (
                    <a
                      key={index}
                      href={item.link}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-md group"
                    >
                      <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground text-sm">
                          {item.title}
                        </div>
                        <div className="font-bold text-lg">
                          {item.value}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-sm"
              >
                <h2 className="text-2xl font-bold mb-6">
                  {isRTL ? 'أرسل لنا رسالة' : 'Send us a message'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{isRTL ? 'الاسم' : 'Name'}</Label>
                      <Input id="name" required placeholder={isRTL ? 'اسمك الكامل' : 'Full Name'} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input id="email" type="email" required placeholder="name@example.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">{isRTL ? 'الموضوع' : 'Subject'}</Label>
                    <Input id="subject" required placeholder={isRTL ? 'موضوع الرسالة' : 'Message Subject'} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">{isRTL ? 'الرسالة' : 'Message'}</Label>
                    <Textarea 
                      id="message" 
                      required 
                      placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                      className="min-h-[150px]"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    )}
                    {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
    </PlatformLayout>
  );
}
