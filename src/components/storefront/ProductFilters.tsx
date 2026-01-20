import { useState } from 'react';
import { X, Search, SlidersHorizontal, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FilterOptions {
  categories?: string[];
  priceRange?: [number, number];
  rating?: number;
  instantDelivery?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

interface ProductFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  language?: 'ar' | 'en';
  categories?: Array<{ id: string; name: string; nameAr: string }>;
}

export function ProductFilters({
  isOpen,
  onClose,
  onApplyFilters,
  language = 'ar',
  categories = []
}: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [instantOnly, setInstantOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  const defaultCategories = [
    { id: '1', name: 'Gaming', nameAr: 'ألعاب' },
    { id: '2', name: 'Gift Cards', nameAr: 'بطاقات هدايا' },
    { id: '3', name: 'Mobile & Data', nameAr: 'جوال وبيانات' },
    { id: '4', name: 'Entertainment', nameAr: 'ترفيه' },
  ];

  const activeCategories = categories.length > 0 ? categories : defaultCategories;

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      categories: selectedCategories,
      priceRange,
      rating: minRating,
      instantDelivery: instantOnly,
      sortBy: sortBy as any
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setMinRating(0);
    setInstantOnly(false);
    setSortBy('newest');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full w-full max-w-sm bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <SlidersHorizontal className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {language === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Sort By */}
            <div className="space-y-3">
              <Label className="text-white font-semibold">
                {language === 'ar' ? 'ترتيب حسب' : 'Sort By'}
              </Label>
              <RadioGroup value={sortBy} onValueChange={setSortBy}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="newest" id="newest" />
                  <Label htmlFor="newest" className="text-gray-300 cursor-pointer">
                    {language === 'ar' ? 'الأحدث' : 'Newest'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="price-asc" id="price-asc" />
                  <Label htmlFor="price-asc" className="text-gray-300 cursor-pointer">
                    {language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="price-desc" id="price-desc" />
                  <Label htmlFor="price-desc" className="text-gray-300 cursor-pointer">
                    {language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="rating" id="rating" />
                  <Label htmlFor="rating" className="text-gray-300 cursor-pointer">
                    {language === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-white font-semibold">
                {language === 'ar' ? 'الفئات' : 'Categories'}
              </Label>
              <div className="space-y-2">
                {activeCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label
                      htmlFor={category.id}
                      className="text-gray-300 cursor-pointer flex-1"
                    >
                      {language === 'ar' ? category.nameAr : category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-white font-semibold">
                {language === 'ar' ? 'نطاق السعر' : 'Price Range'}
              </Label>
              <div className="space-y-4">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {priceRange[0]} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                  <span className="text-gray-400">
                    {priceRange[1]} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label className="text-white font-semibold">
                {language === 'ar' ? 'التقييم' : 'Rating'}
              </Label>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      minRating === rating
                        ? 'bg-purple-500/20 border border-purple-500'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-300 text-sm">
                      {language === 'ar' ? 'وأعلى' : '& up'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Delivery */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Checkbox
                  id="instant"
                  checked={instantOnly}
                  onCheckedChange={(checked) => setInstantOnly(checked as boolean)}
                />
                <Label htmlFor="instant" className="text-green-400 cursor-pointer flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {language === 'ar' ? 'توصيل فوري فقط' : 'Instant Delivery Only'}
                </Label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 p-6 space-y-3 bg-gray-900/50 backdrop-blur-sm">
            <Button
              onClick={handleApply}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6"
            >
              {language === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {language === 'ar' ? 'إعادة تعيين' : 'Reset Filters'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
