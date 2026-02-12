import { ShoppingCart, Eye, Heart, Star, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/services/types';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface SubMarketProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  showQuickView?: boolean;
}

export const SubMarketProductCard = ({ 
  product, 
  viewMode = 'grid',
  showQuickView = true 
}: SubMarketProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    if (product.variants && product.variants.length > 0) {
      toast({
        title: 'Select Options',
        description: 'Please go to product page to select options',
        variant: 'default',
      });
      return;
    }
    
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({
        title: 'Added!',
        description: `${product.name} added to cart`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to cart',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? 'Removed' : 'Added',
      description: isWishlisted 
        ? 'Product removed from favorites' 
        : 'Product added to favorites',
    });
  };

  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
  const price = Number(product.price) || 0;
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const discount = compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  // Rating calculation (if available)
  const rating = (product as any).rating || 0;
  const reviewCount = (product as any).reviewCount || 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to={`/products/${product.id}`} className="block group">
          <Card className="overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card">
            <div className="flex gap-6 p-6">
              <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-muted rounded-lg">
                {discount > 0 && (
                  <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 text-sm font-bold shadow-lg">
                    -{discount}%
                  </Badge>
                )}
                <OptimizedImage
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-2xl mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {product.description}
                    </p>
                  )}
                  {rating > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({reviewCount})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">
                      ${price.toFixed(2)}
                    </span>
                    {compareAtPrice > price && (
                      <span className="text-xl text-muted-foreground line-through">
                        ${compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleToggleWishlist}
                      className={isWishlisted ? 'bg-red-50 border-red-500 text-red-500' : ''}
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {isAdding ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.id}`} className="block group h-full">
        <Card className="overflow-hidden border hover:border-primary/50 hover:shadow-xl transition-all duration-300 bg-card h-full flex flex-col">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {discount > 0 && (
              <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1.5 text-sm font-bold shadow-lg">
                <Tag className="h-3 w-3 mr-1" />
                -{discount}%
              </Badge>
            )}
            
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-3 left-3 z-10 p-2.5 rounded-full backdrop-blur-sm transition-all ${
                isWishlisted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {showQuickView && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 bg-white/95 hover:bg-white shadow-xl"
                >
                  <Eye className="h-5 w-5" />
                  Quick View
                </Button>
              </div>
            )}

            <OptimizedImage
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {product.description}
              </p>
            )}

            {rating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviewCount})
                </span>
              </div>
            )}
            
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-primary">
                  ${price.toFixed(2)}
                </span>
                {compareAtPrice > price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

