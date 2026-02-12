import { SafeHTML } from '../common/SafeHTML';

interface RichTextProps {
  content?: string;
  title?: string;
  subtitle?: string;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backgroundColor?: string;
}

export function RichText({
  content = '<p>هذا نص تجريبي يمكن تخصيصه بالكامل. يدعم هذا المكون <strong>النص الغامق</strong> و<em>النص المائل</em> والمزيد من التنسيقات.</p><p>يمكنك إضافة فقرات متعددة وقوائم ونصوص منسقة بالكامل.</p>',
  title,
  subtitle,
  textAlign = 'right',
  maxWidth = 'lg',
  backgroundColor = 'bg-transparent'
}: RichTextProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <section className={`py-16 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${alignmentClasses[textAlign]}`}>
          {/* Title */}
          {title && (
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {title}
            </h2>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xl text-gray-400 mb-8">
              {subtitle}
            </p>
          )}

          {/* Rich Content - SECURITY FIX: Using SafeHTML to prevent XSS */}
          <SafeHTML
            html={content || ''}
            className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300
              prose-strong:text-white prose-strong:font-bold
              prose-em:text-gray-400
              prose-ul:text-gray-300 prose-ul:list-disc prose-ul:mr-6
              prose-ol:text-gray-300 prose-ol:list-decimal prose-ol:mr-6
              prose-li:mb-2
              prose-blockquote:border-r-4 prose-blockquote:border-purple-500 prose-blockquote:pr-4 prose-blockquote:italic prose-blockquote:text-gray-400
              prose-code:text-purple-400 prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
            "
          />
        </div>
      </div>
    </section>
  );
}
