import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SubMarketProductCard } from '@/components/submarket/SubMarketProductCard';
import { ProductFilters, FilterState } from '@/components/submarket/ProductFilters';
import { SearchBar } from '@/components/submarket/SearchBar';
import { coreApi } from '@/lib/api';
import { Product, Category } from '@/services/types';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryListing() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    minRating: 0,
    inStock: false,
    onSale: false,
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    loadData();
  }, [id, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit: 50,
      };

      if (id) {
        params.categoryId = id;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const [productsData, categoriesData, categoryData] = await Promise.all([
        coreApi.getProducts(params).catch(() => []),
        coreApi.getCategories().catch(() => []),
        id ? coreApi.get(`/categories/${id}`).catch(() => null) : Promise.resolve(null)
      ]);

      // Product service already handles response unwrapping and returns Product[]
      const products = Array.isArray(productsData) ? productsData : [];
      const validProducts = products.map((p) => ({
        ...p,
        price: Number(p.price) || 0,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined
      }));

      // Apply filters
      let filteredProducts = validProducts;
      
      if (filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          filters.categories.includes(p.categoryId || '')
        );
      }

      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        filteredProducts = filteredProducts.filter(p => {
          const price = Number(p.price) || 0;
          return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });
      }

      if (filters.onSale) {
        filteredProducts = filteredProducts.filter(p => 
          p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)
        );
      }

      setProducts(filteredProducts);
      
      // Categories service returns Category[]
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(categories.filter((cat: Category) => !cat.parentId));
      
      if (categoryData) {
        setCategory(categoryData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Reload products with new filters
    loadData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          {category ? (
            <>
              <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground text-lg">{category.description}</p>
              )}
            </>
          ) : (
            <h1 className="text-4xl font-bold mb-2">All Products</h1>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar 
            placeholder="Search products..." 
            onSearch={handleSearch}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters 
              categories={categories}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">No products found</p>
                <Button asChild>
                  <Link to="/products">Browse All Products</Link>
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <SubMarketProductCard 
                      product={product} 
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

