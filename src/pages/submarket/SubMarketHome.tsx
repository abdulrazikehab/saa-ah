import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, TrendingUp, Star, Shield, Zap, Award,
  ArrowRight, CheckCircle2
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { SubMarketProductCard } from '@/components/submarket/SubMarketProductCard';
import { CategoryCard } from '@/components/submarket/CategoryCard';
import { SearchBar } from '@/components/submarket/SearchBar';
import { Product, Category } from '@/services/types';
import { motion } from 'framer-motion';

export default function SubMarketHome() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        coreApi.getProducts({ limit: 12 }).catch(() => []),
        coreApi.getCategories().catch(() => [])
      ]);

      // Product service already handles response unwrapping and returns Product[]
      const products = Array.isArray(productsData) ? productsData : [];
      const validProducts = products.map((p) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined
      }));

      setFeaturedProducts(validProducts.slice(0, 8));
      setPopularProducts(validProducts.slice(0, 6));
      
      // Categories service returns Category[]
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      const rootCategories = categories.filter((cat: Category) => !cat.parentId);
      setCategories(rootCategories.slice(0, 6));
    } catch (error) {
      console.error('Failed to load data:', error);
      setFeaturedProducts([]);
      setPopularProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Get your digital cards in seconds'
    },
    {
      icon: Shield,
      title: '100% Secure',
      description: 'Safe and encrypted transactions'
    },
    {
      icon: Award,
      title: 'Best Prices',
      description: 'Competitive pricing guaranteed'
    },
    {
      icon: Star,
      title: 'Top Rated',
      description: '4.9/5 customer satisfaction'
    }
  ];

  const stats = [
    { value: '15,000+', label: 'Happy Customers' },
    { value: '100,000+', label: 'Cards Delivered' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '< 10s', label: 'Delivery Time' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trusted Digital Cards Marketplace
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Digital Cards at Your Fingertips
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              iTunes | Google Play | PlayStation | Xbox | Steam | PUBG | Netflix
              <br />
              Instant delivery in seconds
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Browse All Cards
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="py-8 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <SearchBar placeholder="Search for digital cards, games, subscriptions..." />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
                <p className="text-muted-foreground">Browse our wide selection of digital cards</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/categories">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
                <p className="text-muted-foreground">Handpicked selections just for you</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/products">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <SubMarketProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      {popularProducts.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Popular Products</h2>
                <p className="text-muted-foreground">Most purchased digital cards</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/products?sort=popular">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularProducts.map((product) => (
                <SubMarketProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Section / CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of satisfied customers and get instant access to digital cards
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {['Secure Payments', 'Instant Delivery', '24/7 Support', 'Money Back Guarantee'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="text-lg px-8">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Start Shopping Now
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}

