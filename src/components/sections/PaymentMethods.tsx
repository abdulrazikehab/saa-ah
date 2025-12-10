interface PaymentMethod {
  name: string;
  logo?: string;
  color?: string;
}

interface PaymentMethodsProps {
  title?: string;
  subtitle?: string;
  methods?: PaymentMethod[];
  layout?: 'horizontal' | 'grid';
}

export function PaymentMethods({
  title = 'طرق الدفع المتاحة',
  subtitle = 'ادفع بالطريقة التي تناسبك',
  methods = [],
  layout = 'horizontal'
}: PaymentMethodsProps) {
  const defaultMethods: PaymentMethod[] = [
    { name: 'VISA', color: 'bg-blue-600' },
    { name: 'MASTERCARD', color: 'bg-orange-600' },
    { name: 'MADA', color: 'bg-green-600' },
    { name: 'APPLE PAY', color: 'bg-gray-900' },
    { name: 'STC PAY', color: 'bg-purple-600' },
    { name: 'PAYPAL', color: 'bg-blue-500' },
    { name: 'TABBY', color: 'bg-teal-600' },
    { name: 'TAMARA', color: 'bg-pink-600' },
  ];

  const activeMethods = methods.length > 0 ? methods : defaultMethods;

  const layoutClasses = {
    horizontal: 'flex flex-wrap items-center justify-center gap-4',
    grid: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4'
  };

  return (
    <section className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-400 text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Payment Methods */}
        <div className={layoutClasses[layout]}>
          {activeMethods.map((method, index) => (
            <div
              key={index}
              className="group relative"
            >
              {method.logo ? (
                <div className="w-24 h-16 bg-white rounded-lg p-2 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg">
                  <img
                    src={method.logo}
                    alt={method.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className={`${method.color || 'bg-gray-800'} px-6 py-3 rounded-lg text-white font-bold text-sm text-center hover:scale-110 transition-transform duration-300 shadow-lg min-w-[100px]`}>
                  {method.name}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security Badge */}
        <div className="mt-12 flex items-center justify-center gap-3 text-gray-400">
          <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">جميع المعاملات آمنة ومشفرة بنسبة 100%</span>
        </div>
      </div>
    </section>
  );
}
