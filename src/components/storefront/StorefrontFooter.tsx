import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { coreApi } from '@/lib/api';

export function StorefrontFooter() {
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const hasAdminToken = !!localStorage.getItem('accessToken');
        const config = await coreApi.get('/site-config', { requireAuth: hasAdminToken });
        setSiteConfig(config);
        if (config.settings?.language) {
          setLanguage(config.settings.language);
        }
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
    { label: language === 'ar' ? 'تتبع الطلب' : 'Track Order', url: '/track-order' },
  ];

  const socialLinks = siteConfig?.footer?.socialLinks || [];
  const footerButtons = siteConfig?.footer?.buttons || [];

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 border-t border-gray-800">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {siteConfig?.settings?.storeLogoUrl ? (
                <img 
                  src={siteConfig.settings.storeLogoUrl} 
                  alt={storeName}
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {storeName.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{storeName}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {storeDescription}
            </p>
            {/* App Download Buttons */}
            {(siteConfig?.settings?.googlePlayUrl || siteConfig?.settings?.appStoreUrl) && (
              <div className="flex flex-col gap-2 pt-2">
                {siteConfig?.settings?.googlePlayUrl && (
                  <a 
                    href={siteConfig.settings.googlePlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">{language === 'ar' ? 'حمل من' : 'Get it on'}</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </a>
                )}
                {siteConfig?.settings?.appStoreUrl && (
                  <a 
                    href={siteConfig.settings.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">{language === 'ar' ? 'حمل من' : 'Download on'}</div>
                      <div className="text-sm font-semibold">App Store</div>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.url}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              {language === 'ar' ? 'معلومات مهمة' : 'Information'}
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.url}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h4>
            <ul className="space-y-3">
              {siteConfig?.settings?.email && (
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <a 
                    href={`mailto:${siteConfig.settings.email}`}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {siteConfig.settings.email}
                  </a>
                </li>
              )}
              {siteConfig?.settings?.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <a 
                    href={`tel:${siteConfig.settings.phone}`}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {siteConfig.settings.phone}
                  </a>
                </li>
              )}
              {siteConfig?.settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">
                    {siteConfig.settings.address}
                    {siteConfig.settings.city && `, ${siteConfig.settings.city}`}
                  </span>
                </li>
              )}
            </ul>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                </h5>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social: any, index: number) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-800 hover:bg-primary rounded-full transition-colors"
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
              <div className="mt-6">
                <div className="flex flex-col gap-2">
                  {footerButtons.map((button: any, index: number) => {
                    const buttonClasses = button.variant === 'primary' 
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : button.variant === 'secondary'
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white';
                    
                    return button.url.startsWith('http') ? (
                      <a
                        key={`footer-btn-${index}`}
                        href={button.url}
                        target={button.openInNewTab ? '_blank' : '_self'}
                        rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-center text-sm ${buttonClasses}`}
                      >
                        {button.label}
                      </a>
                    ) : (
                      <Link
                        key={`footer-btn-${index}`}
                        to={button.url}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-center text-sm ${buttonClasses}`}
                      >
                        {button.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} {storeName}. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
            <div className="flex items-center gap-4">
              <span>{language === 'ar' ? 'طرق الدفع المتاحة:' : 'Payment Methods:'}</span>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-gray-800 rounded text-xs font-semibold">VISA</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs font-semibold">MADA</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs font-semibold">MASTER</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
