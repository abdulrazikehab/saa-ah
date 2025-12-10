import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  authorAr: string;
  rating: number;
  date: string;
  comment: string;
  commentAr: string;
  avatar?: string;
  verified?: boolean;
}

interface ProductReviewsProps {
  reviews?: Review[];
  language?: 'ar' | 'en';
  averageRating?: number;
  totalReviews?: number;
}

export function ProductReviews({
  reviews = [],
  language = 'ar',
  averageRating = 0,
  totalReviews = 0
}: ProductReviewsProps) {
  const defaultReviews: Review[] = [
    {
      id: '1',
      author: 'Ahmed Mohammed',
      authorAr: 'أحمد محمد',
      rating: 5,
      date: '2024-01-15',
      comment: 'Excellent service! Received my code instantly.',
      commentAr: 'خدمة ممتازة! استلمت الكود فوراً.',
      verified: true
    },
    {
      id: '2',
      author: 'Sara Ali',
      authorAr: 'سارة علي',
      rating: 4,
      date: '2024-01-10',
      comment: 'Good product, fast delivery.',
      commentAr: 'منتج جيد، توصيل سريع.',
      verified: true
    },
  ];

  const activeReviews = reviews.length > 0 ? reviews : defaultReviews;
  const displayRating = averageRating || 4.8;
  const displayTotal = totalReviews || activeReviews.length;

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  activeReviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  return (
    <div className="py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {language === 'ar' ? 'آراء العملاء' : 'Customer Reviews'}
          </h2>
          <p className="text-gray-400 text-lg">
            {language === 'ar' ? 'ماذا يقول عملاؤنا' : 'What our customers say'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Rating Summary */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-8">
            <div className="text-center space-y-4">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {displayRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < Math.floor(displayRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-400">
                {language === 'ar' ? 'بناءً على' : 'Based on'} {displayTotal} {language === 'ar' ? 'تقييم' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="mt-8 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating - 1];
                const percentage = displayTotal > 0 ? (count / displayTotal) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-sm w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {activeReviews.map((review) => (
              <Card key={review.id} className="bg-gray-900 border-gray-800 p-6 hover:border-purple-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(language === 'ar' ? review.authorAr : review.author).charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author & Rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">
                            {language === 'ar' ? review.authorAr : review.author}
                          </h3>
                          {review.verified && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                              {language === 'ar' ? 'موثق' : 'Verified'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">
                          {new Date(review.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="relative">
                      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-purple-500/20" />
                      <p className="text-gray-300 leading-relaxed pl-6">
                        {language === 'ar' ? review.commentAr : review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
