import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, Package, FileText, CreditCard, User, 
  ShoppingBag, Heart, Settings, LogOut, CheckCircle2,
  Clock, XCircle, Loader2
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PurchasedProduct {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  code?: string;
  status: 'pending' | 'delivered' | 'used' | 'expired';
  purchasedAt: string;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: PurchasedProduct[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const token = localStorage.getItem('customerToken');
      if (token) {
        try {
          const userData = await coreApi.get('/auth/me', { requireAuth: true });
          setProfile(userData);
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      }

      // Load orders (which contain purchased products)
      const ordersData = await coreApi.get('/orders', { requireAuth: true }).catch(() => []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // Extract purchased products from orders
      const products: PurchasedProduct[] = [];
      orders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          products.push({
            id: item.id || `${order.id}-${item.productId}`,
            orderId: order.id,
            productId: item.productId,
            productName: item.productName || 'Unknown Product',
            productImage: item.productImage,
            code: item.code,
            status: item.status || 'delivered',
            purchasedAt: order.createdAt,
            price: item.price || 0,
          });
        });
      });
      setPurchasedProducts(products);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (product: PurchasedProduct) => {
    if (!product.code) {
      toast({
        title: 'No Code Available',
        description: 'This product does not have a downloadable code yet.',
        variant: 'destructive',
      });
      return;
    }

    // Create a text file with the code
    const blob = new Blob([product.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.productName}-code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Product code downloaded successfully',
    });
  };

  const handleViewInvoice = (orderId: string) => {
    // Navigate to invoice page or open modal
    window.open(`/orders/${orderId}/invoice`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      delivered: { variant: 'default', icon: CheckCircle2 },
      pending: { variant: 'secondary', icon: Clock },
      used: { variant: 'outline', icon: CheckCircle2 },
      expired: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || { variant: 'secondary', icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your purchases and account</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-6">
              {/* Profile Section */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold text-lg">{profile?.name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email || ''}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <Button
                  variant={activeTab === 'products' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('products')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  My Products
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('orders')}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Orders
                </Button>
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === 'payment' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payment')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment History
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => {
                    localStorage.removeItem('customerToken');
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="products">My Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="payment">Payment History</TabsTrigger>
              </TabsList>

              {/* Purchased Products Tab */}
              <TabsContent value="products">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Purchased Products</h2>
                    <Badge variant="secondary">{purchasedProducts.length} items</Badge>
                  </div>

                  {purchasedProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No purchased products yet</p>
                      <Button asChild>
                        <Link to="/products">Browse Products</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchasedProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-4">
                              {product.productImage && (
                                <img
                                  src={product.productImage}
                                  alt={product.productName}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{product.productName}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span>Order #{product.orderId.slice(0, 8)}</span>
                                  <span>•</span>
                                  <span>{new Date(product.purchasedAt).toLocaleDateString()}</span>
                                </div>
                                {product.code && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                                      {product.code}
                                    </code>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(product.status)}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(product)}
                                  disabled={!product.code || product.status === 'used'}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewInvoice(product.orderId)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Invoice
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Order History</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Button asChild>
                        <Link to="/products">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{order.items?.length || 0}</TableCell>
                            <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewInvoice(order.id)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <input
                        type="text"
                        defaultValue={profile?.name || ''}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <input
                        type="email"
                        defaultValue={profile?.email || ''}
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled
                      />
                    </div>
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="payment">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Payment History</h2>
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Payment history will appear here</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}

