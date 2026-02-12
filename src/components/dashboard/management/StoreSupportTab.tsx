import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StoreSupportTab() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/support-tickets').catch(() => []);
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to load tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'WAITING_CUSTOMER': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CLOSED': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'مفتوح';
      case 'IN_PROGRESS': return 'قيد المعالجة';
      case 'WAITING_CUSTOMER': return 'بانتظار العميل';
      case 'RESOLVED': return 'تم الحل';
      case 'CLOSED': return 'مغلق';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <TicketDetailView 
        ticket={selectedTicket} 
        onBack={() => {
          setSelectedTicket(null);
          loadTickets();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">تذاكر الدعم</h2>
          <p className="text-sm text-muted-foreground">
            إدارة تذاكر الدعم الخاصة بعملائك
          </p>
        </div>
        <Button onClick={loadTickets} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحديث'}
        </Button>
      </div>

      <div className="grid gap-4">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{ticket.title || 'بدون عنوان'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ticket.user?.name || ticket.user?.email || 'عميل'} • {new Date(ticket.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                      عرض
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">لا توجد تذاكر دعم</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                لم يقم أي من عملائك بفتح تذاكر دعم بعد.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TicketDetailView({ ticket: initialTicket, onBack }: { ticket: any, onBack: () => void }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [reply, setReply] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const { toast } = useToast();

  const handleSendReply = async () => {
    if (!reply.trim()) return;

    try {
      setSending(true);
      const newReply = await coreApi.post(`/support-tickets/${ticket.id}/replies`, {
        message: reply
      });

      // Update local state with the new reply
      setTicket({
        ...ticket,
        replies: [...(ticket.replies || []), newReply],
        status: 'IN_PROGRESS'
      });
      setReply('');
      toast({
        title: 'تم إرسال الرد',
        description: 'تم إرسال ردك وتم تحديث حالة التذكرة.',
      });
    } catch (error) {
      console.error('Failed to send reply', error);
      toast({
        title: 'فشل إرسال الرد',
        description: 'حدث خطأ أثناء محاولة إرسال الرد.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!documentation.trim()) {
      toast({
        title: 'التوثيق مطلوب',
        description: 'يرجى كتابة سبب إغلاق التذكرة.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setClosing(true);
      const updatedTicket = await coreApi.post(`/support-tickets/${ticket.id}/close`, {
        documentation: documentation
      });

      setTicket(updatedTicket);
      setShowCloseForm(false);
      toast({
        title: 'تم إغلاق التذكرة',
        description: 'تم إغلاق التذكرة وإرسال الإشعارات إلى العميل.',
      });
      
      // Refresh to show the new documentation reply
      onBack(); 
    } catch (error) {
      console.error('Failed to close ticket', error);
      toast({
        title: 'فشل إغلاق التذكرة',
        description: 'حدث خطأ أثناء محاولة إغلاق التذكرة.',
        variant: 'destructive',
      });
    } finally {
      setClosing(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'مفتوح';
      case 'IN_PROGRESS': return 'قيد المعالجة';
      case 'WAITING_CUSTOMER': return 'بانتظار العميل';
      case 'RESOLVED': return 'تم الحل';
      case 'CLOSED': return 'مغلق';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← رجوع
          </Button>
          <h2 className="text-xl font-semibold">{ticket.title}</h2>
          <Badge variant="outline">{getStatusLabel(ticket.status)}</Badge>
        </div>
        {ticket.status !== 'CLOSED' && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowCloseForm(!showCloseForm)}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            إغلاق التذكرة
          </Button>
        )}
      </div>

      {showCloseForm && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="py-4">
            <CardTitle className="text-md flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              إغلاق التذكرة مع التوثيق
            </CardTitle>
            <CardDescription>
              يرجى كتابة سبب الإغلاق أو التوثيق النهائي. سيتم إرسال هذا كتنبيه للعميل عبر البريد الإلكتروني والواتساب والجوال.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full min-h-[80px] p-3 rounded-md border border-destructive/20 bg-background text-sm focus:ring-2 focus:ring-destructive outline-none transition-all"
              placeholder="اكتب التوثيق هنا..."
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
              disabled={closing}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCloseForm(false)} disabled={closing}>
                إلغاء
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCloseTicket} disabled={closing || !documentation.trim()}>
                {closing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : 'تأكيد الإغلاق'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">تفاصيل التذكرة</CardTitle>
              <span className="text-xs text-muted-foreground"># {ticket.ticketNumber}</span>
            </div>
            <CardDescription>
              بواسطة: {ticket.user?.name || ticket.user?.email} • {new Date(ticket.createdAt).toLocaleString('ar-SA')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
              {ticket.description}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold px-1">المحادثة</h3>
          {ticket.replies && ticket.replies.length > 0 ? (
            ticket.replies.map((r: any) => (
              <div 
                key={r.id} 
                className={`flex flex-col ${r.isStaffReply ? 'items-start' : 'items-end'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    r.isStaffReply 
                      ? 'bg-primary text-primary-foreground rounded-tl-none' 
                      : 'bg-muted rounded-tr-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                  <span className="text-[10px] opacity-70 mt-2 block">
                    {new Date(r.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">لا توجد ردود بعد.</p>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            {ticket.status === 'CLOSED' ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-lg text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">هذه التذكرة مغلقة</h4>
                <p className="text-sm text-slate-500">لا يمكن إرسال ردود جديدة على التذاكر المغلقة.</p>
              </div>
            ) : (
              <>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="اكتب ردك هنا..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={sending}
                />
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSendReply} disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : 'إرسال الرد'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

