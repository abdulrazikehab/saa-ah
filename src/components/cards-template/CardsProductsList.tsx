import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Package, Box, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
  brand: string;
  wholesalePrice: number;
  profitMargin: number;
  priceBeforeTax: number;
  currency: string;
  suggestedPrice: number;
}

// Sample data matching the screenshot
const sampleProducts: Product[] = [
  {
    id: '2459',
    name: 'ايتونز - 200 ريال - ايتونز (المتجر السعودي)',
    brand: 'ايتونز',
    wholesalePrice: 53.692200,
    profitMargin: 0.550000,
    priceBeforeTax: 53.986500,
    currency: '$',
    suggestedPrice: 53.986500,
  },
  {
    id: '2457',
    name: 'روبلكس - 200 دولار (المتجر الأمريكي)',
    brand: 'روبلكس',
    wholesalePrice: 191.970000,
    profitMargin: 5.490000,
    priceBeforeTax: 202.500000,
    currency: '$',
    suggestedPrice: 202.500000,
  },
  {
    id: '2456',
    name: 'روبلوكس - 150 دولار (المتجر الأمريكي)',
    brand: 'روبلكس',
    wholesalePrice: 143.982900,
    profitMargin: 5.480000,
    priceBeforeTax: 151.875000,
    currency: '$',
    suggestedPrice: 151.875000,
  },
  {
    id: '2455',
    name: 'بلايستيشن - 250 دولار (المتجر الأمريكي)',
    brand: 'بلايستيشن',
    wholesalePrice: 229.494600,
    profitMargin: 10.300000,
    priceBeforeTax: 253.125000,
    currency: '$',
    suggestedPrice: 253.125000,
    image: '/placeholder.svg',
  },
  {
    id: '2454',
    name: 'بلايستيشن - 200 دولار (المتجر الأمريكي)',
    brand: 'بلايستيشن',
    wholesalePrice: 183.594600,
    profitMargin: 10.300000,
    priceBeforeTax: 202.500000,
    currency: '$',
    suggestedPrice: 202.500000,
    image: '/placeholder.svg',
  },
  {
    id: '2453',
    name: 'بلايستيشن - 150 دولار (المتجر الأمريكي)',
    brand: 'بلايستيشن',
    wholesalePrice: 137.697300,
    profitMargin: 10.300000,
    priceBeforeTax: 151.875000,
    currency: '$',
    suggestedPrice: 151.875000,
    image: '/placeholder.svg',
  },
];

export default function CardsProductsList() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [products] = useState<Product[]>(sampleProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 opacity-50"></div>
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Box className="w-6 h-6 text-primary" />
              </div>
              {isRTL ? 'قائمة المنتجات' : 'Products List'}
            </CardTitle>
            <div className="relative w-72">
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground",
                isRTL ? "right-4" : "left-4"
              )} />
              <Input
                placeholder={isRTL ? 'بحث عن منتج...' : 'Search product...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "bg-background border-border h-11 rounded-xl focus:ring-primary/20",
                  isRTL ? "pr-12" : "pl-12"
                )}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'الرقم التعريفي' : 'ID'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'المنتج' : 'Product'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'علامة تجارية' : 'Brand'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'سعر الجملة' : 'Wholesale'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'نسبة الربح' : 'Profit %'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'السعر قبل الضريبة' : 'Pre-tax'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'العملة' : 'Currency'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {isRTL ? 'سعر البيع المقترح' : 'Suggested Price'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <div className="p-6 rounded-2xl bg-muted/30 mb-6 border border-border/50">
                          <Package className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                        <p className="text-foreground text-lg font-medium mb-2">
                          {isRTL ? 'لا توجد منتجات' : 'No Products Found'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {isRTL ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 text-sm font-mono text-muted-foreground">#{product.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden border border-border/50">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <span className="text-sm text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          {product.brand}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground font-mono">
                        {product.wholesalePrice.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <TrendingUp className="w-3 h-3" />
                          {product.profitMargin.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground font-medium">
                        {product.priceBeforeTax.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">{product.currency}</td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-600">
                        {product.suggestedPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer with pagination info */}
          <div className="px-6 py-4 border-t border-border/50 bg-muted/10">
            <p className="text-sm text-muted-foreground text-center">
              {isRTL 
                ? `عرض ${filteredProducts.length} من ${products.length} منتج`
                : `Showing ${filteredProducts.length} of ${products.length} products`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
