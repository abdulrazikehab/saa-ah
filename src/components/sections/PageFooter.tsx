import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube';
  url: string;
}

interface PageFooterProps {
  logo?: string;
  logoText?: string;
  description?: string;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  copyrightText?: string;
  showPaymentMethods?: boolean;
}

export function PageFooter({
  logo,
  logoText = 'متجري',
  description = 'متجرك الإلكتروني المتكامل لجميع احتياجاتك',
  sections = [],
  socialLinks = [],
  contactEmail,
  contactPhone,
  contactAddress,
  copyrightText,
  showPaymentMethods = true
}: PageFooterProps) {
  const defaultSections: FooterSection[] = [
    {
      title: 'روابط سريعة',
      links: [
        { label: 'الرئيسية', url: '/' },
        { label: 'المنتجات', url: '/products' },
        { label: 'العروض', url: '/offers' },
        { label: 'من نحن', url: '/about' },
      ]
    },
    {
      title: 'خدمة العملاء',
      links: [
        { label: 'اتصل بنا', url: '/contact' },
        { label: 'الأسئلة الشائعة', url: '/faq' },
        { label: 'سياسة الإرجاع', url: '/returns' },
        { label: 'الشحن والتوصيل', url: '/shipping' },
      ]
    },
    {
      title: 'معلومات قانونية',
      links: [
        { label: 'سياسة الخصوصية', url: '/privacy' },
        { label: 'الشروط والأحكام', url: '/terms' },
        { label: 'سياسة الاسترجاع', url: '/refund' },
      ]
    },
  ];

  const activeSections = sections.length > 0 ? sections : defaultSections;

  const socialIcons = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube,
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={logoText} className="h-10 w-10 object-contain rounded-lg" />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {logoText.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{logoText}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {description}
            </p>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((social, index) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-800 hover:bg-purple-600 rounded-full transition-colors"
                      aria-label={social.platform}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Sections */}
          {activeSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-semibold text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.url}
                      className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              تواصل معنا
            </h4>
            <ul className="space-y-3">
              {contactEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">
                    {contactAddress}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              {copyrightText || `© ${new Date().getFullYear()} ${logoText}. جميع الحقوق محفوظة.`}
            </p>
            {showPaymentMethods && (
              <div className="flex items-center gap-4">
                <span>طرق الدفع المتاحة:</span>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-600 rounded text-xs font-bold text-white">VISA</div>
                  <div className="px-3 py-1 bg-orange-600 rounded text-xs font-bold text-white">MASTER</div>
                  <div className="px-3 py-1 bg-green-600 rounded text-xs font-bold text-white">MADA</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
