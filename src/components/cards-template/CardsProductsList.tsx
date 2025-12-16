import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [products] = useState<Product[]>(sampleProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {isRTL ? 'قائمة المنتجات' : 'Products List'}
            </CardTitle>
            <div className="relative w-64">
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={isRTL ? 'بحث عن منتج...' : 'Search product...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(isRTL ? "pr-10" : "pl-10")}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'الرقم التعريفي' : 'ID'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'المنتج' : 'Product'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'علامة تجارية' : 'Brand'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'سعر الجملة' : 'Wholesale'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'نسبة الربح' : 'Profit %'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'السعر قبل الضريبة' : 'Pre-tax'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'العملة' : 'Currency'}
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    {isRTL ? 'سعر البيع المقترح' : 'Suggested Price'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground text-lg">
                        {isRTL ? 'لا توجد منتجات' : 'No products'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/10">
                      <td className="py-4 px-4 text-sm">{product.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">{product.brand}</td>
                      <td className="py-4 px-4 text-sm">{product.wholesalePrice.toFixed(6)}</td>
                      <td className="py-4 px-4 text-sm">{product.profitMargin.toFixed(6)}%</td>
                      <td className="py-4 px-4 text-sm text-primary">
                        {product.priceBeforeTax.toFixed(6)}
                      </td>
                      <td className="py-4 px-4 text-sm">{product.currency}</td>
                      <td className="py-4 px-4 text-sm">{product.suggestedPrice.toFixed(6)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
