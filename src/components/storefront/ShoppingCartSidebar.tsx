import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface CartItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  image: string;
  instant?: boolean;
}

interface ShoppingCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  language?: 'ar' | 'en';
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
}

export function ShoppingCartSidebar({
  isOpen,
  onClose,
  items = [],
  language = 'ar',
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ShoppingCartSidebarProps) {
  const [couponCode, setCouponCode] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = 0; // يمكن حسابه من الكوبون
  const total = subtotal - discount;

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
        className={`fixed top-0 ${language === 'ar' ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : language === 'ar' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                </h2>
                <p className="text-sm text-gray-400">
                  {items.length} {language === 'ar' ? 'منتجات' : 'items'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-6 bg-gray-800 rounded-full">
                  <ShoppingBag className="h-16 w-16 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {language === 'ar' ? 'السلة فارغة' : 'Cart is Empty'}
                  </h3>
                  <p className="text-gray-400">
                    {language === 'ar' ? 'ابدأ بإضافة المنتجات' : 'Start adding products'}
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="bg-gray-800 border-gray-700 p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={language === 'ar' ? item.nameAr : item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.instant && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {language === 'ar' ? 'فوري' : 'Instant'}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-1 truncate">
                        {language === 'ar' ? item.nameAr : item.name}
                      </h3>
                      <p className="text-purple-400 font-bold text-lg">
                        {item.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          <Minus className="h-4 w-4 text-white" />
                        </button>
                        <span className="text-white font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                          className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors self-start"
                    >
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-800 p-6 space-y-4 bg-gray-900/50 backdrop-blur-sm">
              {/* Coupon Code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={language === 'ar' ? 'كود الخصم' : 'Coupon code'}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Button variant="outline" className="border-gray-700">
                  {language === 'ar' ? 'تطبيق' : 'Apply'}
                </Button>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{subtotal.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                    <span>-{discount.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {total.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={onCheckout}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-purple-500/50"
              >
                {language === 'ar' ? 'إتمام الطلب' : 'Proceed to Checkout'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{language === 'ar' ? 'دفع آمن ومشفر' : 'Secure & encrypted payment'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
