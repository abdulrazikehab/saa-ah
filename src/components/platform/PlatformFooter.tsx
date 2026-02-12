import { Link } from 'react-router-dom';
import { getLogoUrl } from '@/config/logo.config';
import { VersionFooter } from '@/components/common/VersionFooter';

export function PlatformFooter() {
  return (
    <footer className="bg-card border-t border-border py-16 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={getLogoUrl()} alt="Koun" className="h-10 w-auto" />
              <span className="text-2xl font-bold">Koun</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              المنصة المتكاملة للتجارة الإلكترونية، صممت لتساعدك في بدء وإدارة وتنمية مشروعك التجاري بكل احترافية.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">المنصة</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li><Link to="/#features" className="hover:text-primary transition-colors">المميزات</Link></li>
              <li><Link to="/#pricing" className="hover:text-primary transition-colors">الأسعار</Link></li>
              <li><Link to="/#testimonials" className="hover:text-primary transition-colors">آراء العملاء</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">الشركة</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Koun - كون. جميع الحقوق محفوظة.
          </p>
          <VersionFooter />
        </div>
      </div>
    </footer>
  );
}
