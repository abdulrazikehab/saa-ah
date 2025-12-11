import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, AlertCircle, X } from 'lucide-react';

export default function CookieRequired() {
  const [isVisible, setIsVisible] = useState(false);
  const [isArabic] = useState(true); // Default to Arabic

  useEffect(() => {
    // Check if cookies are enabled
    const checkCookies = () => {
      // Try to set a test cookie
      document.cookie = 'cookieTest=1; path=/';
      const cookiesEnabled = document.cookie.indexOf('cookieTest=') !== -1;
      
      // Delete test cookie
      document.cookie = 'cookieTest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      if (!cookiesEnabled) {
        setIsVisible(true);
      }
    };
    
    checkCookies();
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop - blocks all interaction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />
          
          {/* Cookie Required Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="max-w-2xl w-full bg-gradient-to-br from-red-900/90 via-gray-900 to-red-900/90 rounded-2xl shadow-2xl border-2 border-red-500/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600/30 to-orange-600/30 p-6 border-b border-red-500/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">
                      {isArabic ? 'ملفات تعريف الارتباط مطلوبة' : 'Cookies Required'}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                      {isArabic ? 'يجب تفعيل ملفات تعريف الارتباط لاستخدام الموقع' : 'Cookies must be enabled to use this website'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Cookie className="w-12 h-12 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="text-gray-200 text-base leading-relaxed" dir={isArabic ? 'rtl' : 'ltr'}>
                    {isArabic ? (
                      <>
                        <p className="mb-4 font-semibold text-white">
                          ملفات تعريف الارتباط معطلة في متصفحك.
                        </p>
                        <p className="mb-3">
                          لاستخدام هذا الموقع، يجب تفعيل ملفات تعريف الارتباط. نحن نستخدم ملفات تعريف الارتباط لـ:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                          <li>حفظ جلسة تسجيل الدخول الخاصة بك</li>
                          <li>تذكر تفضيلاتك وإعداداتك</li>
                          <li>ضمان أمان حسابك</li>
                          <li>تحسين تجربتك على الموقع</li>
                        </ul>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                          <p className="text-yellow-200 font-medium mb-2">كيفية تفعيل ملفات تعريف الارتباط:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                            <li>افتح إعدادات المتصفح</li>
                            <li>اذهب إلى قسم "الخصوصية" أو "Privacy"</li>
                            <li>قم بتمكين ملفات تعريف الارتباط</li>
                            <li>أعد تحميل الصفحة</li>
                          </ol>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mb-4 font-semibold text-white">
                          Cookies are disabled in your browser.
                        </p>
                        <p className="mb-3">
                          To use this website, you must enable cookies. We use cookies to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                          <li>Save your login session</li>
                          <li>Remember your preferences and settings</li>
                          <li>Ensure your account security</li>
                          <li>Improve your experience on the site</li>
                        </ul>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                          <p className="text-yellow-200 font-medium mb-2">How to enable cookies:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                            <li>Open your browser settings</li>
                            <li>Go to "Privacy" or "Security" section</li>
                            <li>Enable cookies</li>
                            <li>Reload this page</li>
                          </ol>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reload Button */}
                <div className="flex justify-center" dir={isArabic ? 'rtl' : 'ltr'}>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
                  >
                    <Cookie className="w-5 h-5" />
                    {isArabic ? 'إعادة تحميل الصفحة' : 'Reload Page'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

