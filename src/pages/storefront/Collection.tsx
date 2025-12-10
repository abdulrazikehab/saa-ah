import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Collection() {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadCollection(id);
    }
  }, [id]);

  async function loadCollection(collectionId: string) {
    try {
      const collectionData = await coreApi.getCollection(collectionId);
      setCollection(collectionData);
      
      // Assuming collection data includes products or we need to fetch them separately
      // If the API structure is different, this might need adjustment
      if (collectionData.products) {
        setProducts(collectionData.products);
      } else {
        // Fallback: fetch products for this collection if not included
        // This depends on API implementation
        // const productsData = await coreApi.getProducts({ collection: collectionId });
        // setProducts(productsData);
      }
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addToCart(productId: string) {
    try {
      await coreApi.addToCart(productId, 1);
      toast({
        title: 'Added to cart',
        description: 'Product has been added to your cart.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add product to cart.',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Collection not found</h1>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground text-lg max-w-2xl">{collection.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground text-lg">No products found in this collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">
                  <Link to={`/products/${product.id}`} className="hover:underline">
                    {product.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-bold text-lg">${Number(product.price).toFixed(2)}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => addToCart(product.id)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
