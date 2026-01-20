interface ImageBlockProps {
  image?: string;
  alt?: string;
  caption?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'portrait';
  rounded?: boolean;
  shadow?: boolean;
  overlay?: boolean;
  overlayText?: string;
  overlayPosition?: 'top' | 'center' | 'bottom';
}

export function ImageBlock({
  image = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=800&fit=crop',
  alt = 'صورة',
  caption,
  aspectRatio = 'video',
  rounded = true,
  shadow = true,
  overlay = false,
  overlayText,
  overlayPosition = 'bottom'
}: ImageBlockProps) {
  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    portrait: 'aspect-[3/4]'
  };

  const overlayPositionClasses = {
    top: 'items-start pt-8',
    center: 'items-center',
    bottom: 'items-end pb-8'
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Image Container */}
          <div className={`relative ${aspectRatioClasses[aspectRatio]} overflow-hidden ${rounded ? 'rounded-2xl' : ''} ${shadow ? 'shadow-2xl' : ''} group`}>
            <img
              src={image}
              alt={alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Overlay */}
            {overlay && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            )}

            {/* Overlay Text */}
            {overlayText && (
              <div className={`absolute inset-0 flex ${overlayPositionClasses[overlayPosition]} justify-center px-8`}>
                <h3 className="text-3xl md:text-5xl font-black text-white text-center">
                  {overlayText}
                </h3>
              </div>
            )}
          </div>

          {/* Caption */}
          {caption && (
            <p className="text-center text-gray-400 mt-4 text-sm">
              {caption}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
