import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Category } from '@/services/types';

interface CategoryCardProps {
  category: Category;
  showProductCount?: boolean;
}

export const CategoryCard = ({ category, showProductCount = true }: CategoryCardProps) => {
  const imageUrl = category.image || '/placeholder.svg';
  const productCount = (category as any).productCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/categories/${category.id}`} className="block group">
        <Card className="overflow-hidden border hover:border-primary/50 hover:shadow-xl transition-all duration-300 bg-card">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-bold text-2xl text-white mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-white/90 text-sm line-clamp-2 mb-3">
                  {category.description}
                </p>
              )}
              {showProductCount && productCount > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {productCount} {productCount === 1 ? 'Product' : 'Products'}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

