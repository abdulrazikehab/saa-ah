import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin,
  Heart, ChevronRight
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { VersionFooter } from '@/components/common/VersionFooter';
import { cn } from '@/lib/utils';

export function StorefrontFooter() {
  const { i18n } = useTranslation();
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>(i18n.language as 'ar' | 'en' || 'ar');

  // Sync language with i18n changes
  useEffect(() => {
    const currentLang = i18n.language as 'ar' | 'en';
    if (currentLang === 'ar' || currentLang === 'en') {
      setLanguage(currentLang);
    }
  }, [i18n.language]);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const hasAdminToken = !!localStorage.getItem('accessToken');
        const config = await coreApi.get('/site-config', { requireAuth: false });
        setSiteConfig(config);
        // Don't override i18n language with site config - use i18n as source of truth
      } catch (error) {
        console.error('Failed to load site config:', error);
      }
    };
    loadSiteConfig();
  }, []);

  const storeName = language === 'ar' 
    ? (siteConfig?.settings?.storeNameAr || 'متجري')
    : (siteConfig?.settings?.storeName || 'My Store');

  const storeDescription = language === 'ar'
    ? (siteConfig?.settings?.storeDescriptionAr || 'متجرك الإلكتروني المتكامل')
    : (siteConfig?.settings?.storeDescription || 'Your complete online store');

  const footerLinks = siteConfig?.footer?.links || [
    { label: language === 'ar' ? 'من نحن' : 'About Us', url: '/about' },
    { label: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', url: '/privacy' },
    { label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', url: '/terms' },
    { label: language === 'ar' ? 'سياسة الإرجاع' : 'Return Policy', url: '/returns' },
    { label: language === 'ar' ? 'اتصل بنا' : 'Contact Us', url: '/contact' },
    { label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', url: '/faq' },
  ];

  const quickLinks = [
    { label: language === 'ar' ? 'حسابي' : 'My Account', url: '/account' },
    { label: language === 'ar' ? 'طلباتي' : 'My Orders', url: '/account/orders' },
    { label: language === 'ar' ? 'قائمة الرغبات' : 'Wishlist', url: '/wishlist' },
  ];

  const socialLinks = siteConfig?.footer?.socialLinks || [];
  const footerButtons = siteConfig?.footer?.buttons || [];

  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer */}
      <div className="relative bg-card border-t border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
            {/* About Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl gradient-primary blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                  {siteConfig?.settings?.storeLogoUrl ? (
                    <img 
                      src={siteConfig.settings.storeLogoUrl} 
                      alt={storeName}
                      className="relative h-12 w-12 object-contain rounded-xl transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="relative h-12 w-12 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform duration-300 group-hover:scale-110">
                      {storeName.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold gradient-text">{storeName}</h3>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {storeDescription}
              </p>
              
              {/* App Download Buttons */}
              {(siteConfig?.settings?.googlePlayUrl || siteConfig?.settings?.appStoreUrl) && (
                <div className="flex flex-col gap-2">
                  {siteConfig?.settings?.googlePlayUrl && (
                    <a 
                      href={siteConfig.settings.googlePlayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-4 py-2.5 bg-muted/50 hover:bg-muted rounded-xl transition-all duration-300 border border-border/50 group"
                    >
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">{language === 'ar' ? 'حمل من' : 'Get it on'}</div>
                        <div className="text-sm font-semibold text-foreground">Google Play</div>
                      </div>
                    </a>
                  )}
                  {siteConfig?.settings?.appStoreUrl && (
                    <a 
                      href={siteConfig.settings.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-4 py-2.5 bg-muted/50 hover:bg-muted rounded-xl transition-all duration-300 border border-border/50 group"
                    >
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">{language === 'ar' ? 'حمل من' : 'Download on'}</div>
                        <div className="text-sm font-semibold text-foreground">App Store</div>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full gradient-primary" />
                {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.url}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-4 h-4 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Links */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full gradient-secondary" />
                {language === 'ar' ? 'معلومات مهمة' : 'Information'}
              </h4>
              <ul className="space-y-3">
                {footerLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.url}
                      className="text-muted-foreground hover:text-secondary transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-4 h-4 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full gradient-accent" />
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </h4>
              <ul className="space-y-4">
                {siteConfig?.settings?.email && (
                  <li>
                    <a 
                      href={`mailto:${siteConfig.settings.email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <Mail className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm">{siteConfig.settings.email}</span>
                    </a>
                  </li>
                )}
                {siteConfig?.settings?.phone && (
                  <li>
                    <a 
                      href={`tel:${siteConfig.settings.phone}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <Phone className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm">{siteConfig.settings.phone}</span>
                    </a>
                  </li>
                )}
                {siteConfig?.settings?.address && (
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <MapPin className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm">
                      {siteConfig.settings.address}
                      {siteConfig.settings.city && `, ${siteConfig.settings.city}`}
                    </span>
                  </li>
                )}
              </ul>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="mt-8">
                  <h5 className="text-sm font-semibold text-foreground mb-4">
                    {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                  </h5>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social: any, index: number) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-muted/50 hover:bg-primary hover:text-white border border-border/50 hover:border-primary transition-all duration-300 hover:scale-110 hover:shadow-glow"
                        aria-label={social.platform}
                      >
                        {social.platform === 'facebook' && <Facebook className="h-5 w-5" />}
                        {social.platform === 'twitter' && <Twitter className="h-5 w-5" />}
                        {social.platform === 'instagram' && <Instagram className="h-5 w-5" />}
                        {social.platform === 'youtube' && <Youtube className="h-5 w-5" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              {footerButtons.length > 0 && (
                <div className="mt-6 flex flex-col gap-2">
                  {footerButtons.map((button: any, index: number) => {
                    const isPrimary = button.variant === 'primary';
                    
                    return button.url.startsWith('http') ? (
                      <a
                        key={`footer-btn-${index}`}
                        href={button.url}
                        target={button.openInNewTab ? '_blank' : '_self'}
                        rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                        className={cn(
                          "px-4 py-2.5 rounded-xl font-medium transition-all duration-300 text-center text-sm",
                          isPrimary 
                            ? "gradient-primary text-white hover:shadow-glow" 
                            : "bg-muted/50 hover:bg-muted border border-border/50"
                        )}
                      >
                        {button.label}
                      </a>
                    ) : (
                      <Link
                        key={`footer-btn-${index}`}
                        to={button.url}
                        className={cn(
                          "px-4 py-2.5 rounded-xl font-medium transition-all duration-300 text-center text-sm",
                          isPrimary 
                            ? "gradient-primary text-white hover:shadow-glow" 
                            : "bg-muted/50 hover:bg-muted border border-border/50"
                        )}
                      >
                        {button.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-border/50 bg-muted/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              © {new Date().getFullYear()} {storeName}. 
              <span>{language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
              <Heart className="h-3 w-3 text-accent fill-accent mx-1" />
            </p>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? 'طرق الدفع:' : 'Payment Methods:'}
              </span>
              <div className="flex items-center gap-2">
                {['MADA'].map((method) => (
                  <div 
                    key={method}
                    className="px-3 py-1.5 bg-card rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-default"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Version Footer */}
      <VersionFooter className="bg-muted/10 text-muted-foreground py-3 border-t border-border/30" />
    </footer>
  );
}
