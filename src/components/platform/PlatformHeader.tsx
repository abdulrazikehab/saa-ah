import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ArrowLeft } from 'lucide-react';
import { getLogoUrl } from '@/config/logo.config';
import { cn } from '@/lib/utils';

export function PlatformHeader() {
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
          : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative"
                animate={{ 
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="relative p-2 rounded-xl bg-card border border-border/50 group-hover:border-primary/50 transition-colors"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img src={getLogoUrl()} alt="Saeaa" className="h-8 w-auto" />
                </motion.div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">Saeaa</span>
                <span className="text-xs text-muted-foreground">سِعَة</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'المميزات', href: '/#features' },
                { label: 'الأسعار', href: '/#pricing' },
                { label: 'آراء العملاء', href: '/#testimonials' }
              ].map((item) => (
                <Link 
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium hover:text-primary transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                ابدأ مجاناً
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 right-0 z-40 bg-background border-b border-border md:hidden overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {[
                { label: 'المميزات', href: '/#features' },
                { label: 'الأسعار', href: '/#pricing' },
                { label: 'آراء العملاء', href: '/#testimonials' }
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-medium py-2"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center py-3 rounded-xl bg-muted font-medium"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  ابدأ مجاناً
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
