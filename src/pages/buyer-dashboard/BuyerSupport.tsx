import { useState, useEffect } from 'react';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Paperclip,
  RefreshCw,
  Filter,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface TicketMessage {
  id: string;
  content: string;
  sender: 'user' | 'support';
  senderName: string;
  createdAt: string;
  attachments?: Array<{ name: string; url: string }>;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  orderId?: string;
}

export default function BuyerSupport() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setTickets([
        {
          id: '1',
          ticketNumber: 'TKT-2024-001',
          subject: 'مشكلة في تحميل الملف',
          category: 'مشكلة تقنية',
          status: 'open',
          priority: 'high',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          orderId: 'ORD-2024-002',
          messages: [
            {
              id: '1',
              content: 'لا أستطيع تحميل الملف المشترى. تظهر رسالة خطأ عند النقر على زر التحميل.',
              sender: 'user',
              senderName: 'أحمد محمد',
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '2',
              content: 'مرحباً أحمد،\n\nشكراً لتواصلك معنا. نعتذر عن هذه المشكلة.\n\nهل يمكنك إعلامنا بنوع المتصفح الذي تستخدمه ورسالة الخطأ الكاملة؟',
              sender: 'support',
              senderName: 'فريق الدعم',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        },
        {
          id: '2',
          ticketNumber: 'TKT-2024-002',
          subject: 'استفسار عن محتوى الدورة',
          category: 'استفسار عام',
          status: 'resolved',
          priority: 'low',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          messages: [
            {
              id: '1',
              content: 'هل تتضمن الدورة مشاريع تطبيقية؟',
              sender: 'user',
              senderName: 'أحمد محمد',
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
            },
            {
              id: '2',
              content: 'نعم، تتضمن الدورة 5 مشاريع تطبيقية كاملة.',
              sender: 'support',
              senderName: 'فريق الدعم',
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
            }
          ]
        },
        {
          id: '3',
          ticketNumber: 'TKT-2024-003',
          subject: 'طلب استرداد',
          category: 'استرداد',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          orderId: 'ORD-2024-004',
          messages: [
            {
              id: '1',
              content: 'أرغب في استرداد قيمة الطلب رقم ORD-2024-004 حيث أن المنتج لا يناسب احتياجاتي.',
              sender: 'user',
              senderName: 'أحمد محمد',
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-success' | 'soft-warning' | 'soft-primary' | 'soft-secondary'; icon: React.ElementType }> = {
      open: { label: 'مفتوح', variant: 'soft-primary', icon: AlertCircle },
      pending: { label: 'قيد المراجعة', variant: 'soft-warning', icon: Clock },
      resolved: { label: 'تم الحل', variant: 'soft-success', icon: CheckCircle2 },
      closed: { label: 'مغلق', variant: 'soft-secondary', icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status] || config.open;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: 'منخفض', className: 'bg-muted text-muted-foreground' },
      medium: { label: 'متوسط', className: 'bg-warning/10 text-warning' },
      high: { label: 'عالي', className: 'bg-destructive/10 text-destructive' },
    };
    const { label, className } = config[priority] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const createTicket = async () => {
    if (!newSubject || !newCategory || !newDescription) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Call API to create ticket
    const newTicket: Ticket = {
      id: Date.now().toString(),
      ticketNumber: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newSubject,
      category: newCategory,
      status: 'open',
      priority: newPriority as 'low' | 'medium' | 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: '1',
          content: newDescription,
          sender: 'user',
          senderName: 'أحمد محمد',
          createdAt: new Date().toISOString()
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewTicketOpen(false);
    setNewSubject('');
    setNewCategory('');
    setNewPriority('medium');
    setNewDescription('');

    toast({
      title: 'تم إنشاء التذكرة',
      description: `تم إنشاء التذكرة رقم ${newTicket.ticketNumber}`,
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    // TODO: Call API to send message
    const message: TicketMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      senderName: 'أحمد محمد',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          messages: [...t.messages, message],
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    setSelectedTicket(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message]
    } : null);

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل التذاكر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text flex items-center gap-3">
            <Headphones className="h-8 w-8 text-primary" />
            الدعم الفني
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            تواصل مع فريق الدعم وتتبع تذاكرك
          </p>
        </div>
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              تذكرة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء تذكرة دعم جديدة</DialogTitle>
              <DialogDescription>
                صف مشكلتك أو استفسارك وسيقوم فريق الدعم بالرد في أقرب وقت
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الموضوع *</Label>
                <Input
                  placeholder="اكتب عنوان المشكلة أو الاستفسار"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التصنيف *</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">مشكلة تقنية</SelectItem>
                      <SelectItem value="payment">مشكلة دفع</SelectItem>
                      <SelectItem value="refund">طلب استرداد</SelectItem>
                      <SelectItem value="general">استفسار عام</SelectItem>
                      <SelectItem value="suggestion">اقتراح</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأولوية</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>التفاصيل *</Label>
                <Textarea
                  placeholder="اشرح المشكلة أو الاستفسار بالتفصيل..."
                  rows={5}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTicketOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={createTicket}>
                إرسال التذكرة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي التذاكر</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open' || t.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">مفتوحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
                <p className="text-xs text-muted-foreground">تم حلها</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Headphones className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">متوسط الرد</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder="البحث..."
                  className={isRTL ? 'pr-9' : 'pl-9'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التذاكر</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tickets */}
          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">لا توجد تذاكر</p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1 mb-2">{ticket.subject}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.updatedAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details / Chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[calc(100vh-300px)] flex flex-col">
              <CardHeader className="border-b py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{selectedTicket.ticketNumber}</span>
                      <span>•</span>
                      <span>{selectedTicket.category}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 text-primary" />
                        ) : (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="اكتب ردك هنا..."
                      className="resize-none"
                      rows={2}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-9 w-9" onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-[calc(100vh-300px)] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground">اختر تذكرة لعرض التفاصيل</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

