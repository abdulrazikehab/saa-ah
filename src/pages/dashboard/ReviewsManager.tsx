import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Check, X, Eye, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTablePagination } from '@/components/common/DataTablePagination';

interface Review {
  id: string;
  product: {
    id: string;
    name: string;
    nameAr: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  helpful: number;
  notHelpful: number;
  response?: string;
  createdAt: string;
}

export default function ReviewsManager() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get(`/reviews?page=${currentPage}&limit=${itemsPerPage}`, { requireAuth: true });
      
      // Handle paginated response
      if (response && 'data' in response && 'meta' in response) {
        setReviews(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } else {
        // Legacy response
        const reviewsArray = response.reviews || [];
        setReviews(reviewsArray);
        setTotalItems(reviewsArray.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast({
        title: 'تعذر تحميل التقييمات',
        description: 'حدث خطأ أثناء تحميل التقييمات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentPage, itemsPerPage]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const updateReviewStatus = async (id: string, status: string) => {
    try {
      await coreApi.put(`/reviews/${id}/status`, { status }, { requireAuth: true });
      toast({
        title: 'نجح',
        description: `تم ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} التقييم`,
      });
      loadReviews();
    } catch (error) {
      console.error('Failed to update review status:', error);
      toast({
        title: 'تعذر تحديث حالة التقييم',
        description: 'حدث خطأ أثناء تحديث حالة التقييم. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      await coreApi.delete(`/reviews/${id}`, { requireAuth: true });
      toast({ title: 'نجح', description: 'تم حذف التقييم بنجاح' });
      loadReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast({
        title: 'تعذر حذف التقييم',
        description: 'حدث خطأ أثناء حذف التقييم. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const saveResponse = async () => {
    if (!selectedReview) return;

    try {
      setSaving(true);
      await coreApi.post(`/reviews/${selectedReview.id}/response`, { response: responseText }, { requireAuth: true });
      toast({ title: 'نجح', description: 'تم إضافة الرد بنجاح' });
      setIsResponseDialogOpen(false);
      setResponseText('');
      setSelectedReview(null);
      loadReviews();
    } catch (error) {
      console.error('Failed to save response:', error);
      toast({
        title: 'تعذر إضافة الرد',
        description: 'حدث خطأ أثناء إضافة الرد. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openResponseDialog = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response || '');
    setIsResponseDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { label: 'قيد المراجعة', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      APPROVED: { label: 'موافق عليه', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      REJECTED: { label: 'مرفوض', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.PENDING;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    const matchesSearch = 
      review.product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRating && matchesSearch;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'PENDING').length,
    approved: reviews.filter(r => r.status === 'APPROVED').length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقييمات والتعليقات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة تقييمات العملاء والرد عليها</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي التقييمات</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">قيد المراجعة</p>
                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">موافق عليها</p>
                <p className="text-2xl font-bold mt-1">{stats.approved}</p>
              </div>
              <Check className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">متوسط التقييم</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="البحث في التقييمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                <SelectItem value="APPROVED">موافق عليها</SelectItem>
                <SelectItem value="REJECTED">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[180px]">
                <Star className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التقييمات</SelectItem>
                <SelectItem value="5">5 نجوم</SelectItem>
                <SelectItem value="4">4 نجوم</SelectItem>
                <SelectItem value="3">3 نجوم</SelectItem>
                <SelectItem value="2">2 نجوم</SelectItem>
                <SelectItem value="1">1 نجمة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد تقييمات</h3>
              <p className="text-gray-500">لم يتم العثور على تقييمات مطابقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>التعليق</TableHead>
                  <TableHead>مفيد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <p className="font-medium">{review.product.nameAr}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {review.customer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{review.customer.name}</p>
                          <p className="text-xs text-gray-500">{review.customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStars(review.rating)}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {review.title && (
                        <p className="font-medium text-sm mb-1">{review.title}</p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                      {review.response && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">رد المتجر:</p>
                          <p className="text-blue-700 dark:text-blue-300">{review.response}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpful}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="h-3 w-3" />
                          {review.notHelpful}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {review.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                              title="موافقة"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateReviewStatus(review.id, 'REJECTED')}
                              title="رفض"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openResponseDialog(review)}
                          title="الرد"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReview(review.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
            <DialogDescription>
              أضف ردك على تقييم العميل
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{selectedReview.customer.name}</p>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReview.comment}</p>
              </div>

              <div>
                <Label>ردك</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="شكراً لتقييمك..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveResponse} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'إضافة الرد'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
