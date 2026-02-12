import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from 'react-i18next';
import { getLogoUrl } from '@/config/logo.config';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.products'), href: '/products' },
    { name: t('nav.categories'), href: '/categories' },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 glass-effect-strong" />
      
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary animate-gradient bg-[length:200%_auto]" />
      
      <div className="container relative flex h-18 items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link 
            to="/" 
            className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <div className="relative">
              {/* Logo glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/30 to-secondary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src={getLogoUrl()} 
                alt="Koun" 
                className="relative h-16 w-auto drop-shadow-lg" 
              />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 group",
                  isActivePath(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active/Hover Background */}
                <span className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-300",
                  isActivePath(item.href)
                    ? "bg-primary/10"
                    : "bg-transparent group-hover:bg-muted/50"
                )} />
                
                {/* Active Indicator */}
                {isActivePath(item.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full gradient-primary animate-scale-in" />
                )}
                
                <span className="relative">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-110"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
          {/* Theme & Language */}
          <div className="hidden sm:flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          
          {/* Wishlist */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild 
            className="relative rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-110 group"
          >
            <Link to="/wishlist">
              <Heart className="h-5 w-5 transition-colors group-hover:text-accent" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>
          
          {/* Cart */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild 
            className="relative rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-110 group"
          >
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5 transition-colors group-hover:text-primary" />
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold gradient-accent border-2 border-background animate-bounce-in shadow-glow-accent"
              >
                0
              </Badge>
            </Link>
          </Button>

          {/* User Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild 
            className="relative rounded-xl hover:bg-muted/50 transition-all duration-300 hover:scale-110"
          >
            <Link to="/profile">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-muted/50 transition-all duration-300"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 glass-effect-strong border-border/50">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-border/50">
                  <img src={getLogoUrl()} alt="Koun" className="h-10 w-auto" />
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    متجري
                  </div>
                </div>
                
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-2 mt-6 flex-1">
                  {navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 animate-slide-up",
                        isActivePath(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {isActivePath(item.href) && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full gradient-primary" />
                      )}
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                {/* Mobile Footer Actions */}
                <div className="pt-6 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                  <Button className="w-full gradient-primary text-white font-semibold rounded-xl h-12 shadow-glow hover:shadow-glow transition-shadow">
                    تسجيل الدخول
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 glass-effect-strong border-t border-border/30 animate-slide-down">
          <div className="container py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('nav.search') || "ابحث عن منتجات..."}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
