import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { Shield, Lock, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const sections = [
    {
      title: isRTL ? 'جمع المعلومات' : 'Information Collection',
      content: isRTL 
        ? 'نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في الموقع، مثل الاسم وعنوان البريد الإلكتروني ورقم الهاتف. كما نقوم بجمع معلومات حول كيفية استخدامك للموقع لتحسين تجربتك.'
        : 'We collect information you provide directly to us when registering on the site, such as name, email address, and phone number. We also collect information about how you use the site to improve your experience.'
    },
    {
      title: isRTL ? 'استخدام المعلومات' : 'Information Usage',
      content: isRTL
        ? 'نستخدم المعلومات التي نجمعها لتقديم خدماتنا وتحسينها، والتواصل معك، وإرسال التحديثات والعروض الترويجية (بموافقتك)، وحماية حقوقنا وحقوق مستخدمينا.'
        : 'We use the information we collect to provide and improve our services, communicate with you, send updates and promotional offers (with your consent), and protect our rights and the rights of our users.'
    },
    {
      title: isRTL ? 'مشاركة المعلومات' : 'Information Sharing',
      content: isRTL
        ? 'لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع مزودي الخدمات الذين يساعدوننا في تشغيل الموقع، وذلك وفقاً لسياسات خصوصية صارمة.'
        : 'We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating the site, subject to strict privacy policies.'
    },
    {
      title: isRTL ? 'أمن المعلومات' : 'Data Security',
      content: isRTL
        ? 'نحن نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف. نستخدم تقنيات التشفير وبروتوكولات الأمان القياسية.'
        : 'We take appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. We use encryption technologies and standard security protocols.'
    },
    {
      title: isRTL ? 'حقوق المستخدم' : 'User Rights',
      content: isRTL
        ? 'لديك الحق في الوصول إلى معلوماتك الشخصية وتصحيحها أو حذفها. يمكنك أيضاً إلغاء الاشتراك في الرسائل التسويقية في أي وقت.'
        : 'You have the right to access, correct, or delete your personal information. You can also unsubscribe from marketing messages at any time.'
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
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <Shield className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {isRTL 
                  ? 'نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية. يرجى قراءة هذه السياسة بعناية.'
                  : 'We are committed to protecting your privacy and personal data. Please read this policy carefully.'}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card p-8 rounded-2xl border border-border/50 hover:border-primary/20 transition-colors"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {section.content}
                  </p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center pt-8 border-t border-border"
              >
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'آخر تحديث: 22 ديسمبر 2025'
                    : 'Last updated: December 22, 2025'}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
    </PlatformLayout>
  );
}
