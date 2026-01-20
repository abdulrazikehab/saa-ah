import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, X } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
}

export default function CookieConsent({ onAccept }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isArabic] = useState(true); // Default to Arabic

  useEffect(() => {
    // Check if user already accepted cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiesAcceptedAt', new Date().toISOString());
    setIsVisible(false);
    onAccept();
  };

  const handleAcceptAll = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiesAnalytics', 'true');
    localStorage.setItem('cookiesMarketing', 'true');
    localStorage.setItem('cookiesAcceptedAt', new Date().toISOString());
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop - blocks interaction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          
          {/* Cookie Consent Modal */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-xl">
                    <Cookie className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isArabic ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isArabic ? 'نحتاج موافقتك للمتابعة' : 'We need your consent to continue'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Shield className="w-10 h-10 text-green-400 flex-shrink-0 mt-1" />
                  <div className="text-gray-300 text-sm leading-relaxed" dir={isArabic ? 'rtl' : 'ltr'}>
                    {isArabic ? (
                      <>
                        <p className="mb-3">
                          نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. تساعدنا هذه الملفات على:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3">
                          <li>تذكر تفضيلاتك وإعداداتك</li>
                          <li>تحسين أمان حسابك</li>
                          <li>تحليل كيفية استخدام الموقع لتحسينه</li>
                          <li>توفير تجربة مخصصة لك</li>
                        </ul>
                        <p className="text-xs text-gray-500">
                          بالنقر على "قبول الكل"، فإنك توافق على استخدام جميع ملفات تعريف الارتباط.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mb-3">
                          We use cookies to improve your experience on our website. These cookies help us:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3">
                          <li>Remember your preferences and settings</li>
                          <li>Improve your account security</li>
                          <li>Analyze how the site is used to improve it</li>
                          <li>Provide a personalized experience</li>
                        </ul>
                        <p className="text-xs text-gray-500">
                          By clicking "Accept All", you agree to the use of all cookies.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3" dir={isArabic ? 'rtl' : 'ltr'}>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                  >
                    {isArabic ? 'قبول الكل' : 'Accept All'}
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors border border-gray-600"
                  >
                    {isArabic ? 'الضروري فقط' : 'Essential Only'}
                  </button>
                </div>

                {/* Privacy Link */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  {isArabic ? (
                    <>
                      بمتابعتك، فإنك توافق على{' '}
                      <a href="/privacy" className="text-violet-400 hover:underline">سياسة الخصوصية</a>
                      {' '}و{' '}
                      <a href="/terms" className="text-violet-400 hover:underline">شروط الاستخدام</a>
                    </>
                  ) : (
                    <>
                      By continuing, you agree to our{' '}
                      <a href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</a>
                      {' '}and{' '}
                      <a href="/terms" className="text-violet-400 hover:underline">Terms of Service</a>
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
