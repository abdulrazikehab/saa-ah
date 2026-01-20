import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Phone, 
  Mail, 
  Clock,
  Headphones,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PartnerStatus {
  asusPartnerCompleted?: boolean;
  smartLinePartnerCompleted?: boolean;
}

export default function SupportPage() {
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPartnerStatus();
  }, []);

  const fetchPartnerStatus = async () => {
    try {
      const response = await coreApi.get('/partner/status', { requireAuth: true });
      setPartnerStatus(response);
    } catch (error) {
      console.error('Failed to fetch partner status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'شكراً لرسالتك! فريق الدعم سيتواصل معك قريباً. في هذه الأثناء، يمكنك مراجعة مركز المساعدة للحصول على إجابات فورية.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsSending(false);
    }, 1000);
  };

  const handleContactSupport = (partner: 'asus' | 'smartline', method: string) => {
    toast({
      title: 'تم فتح قناة الدعم',
      description: `سيتم توجيهك إلى ${method} ${partner === 'asus' ? 'ASUS' : 'Smart Line'}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasAsusSupport = partnerStatus?.asusPartnerCompleted;

  if (!hasAsusSupport) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Headphones className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">دعم ASUS</h2>
            <p className="text-gray-600 mb-6">
              قم بإكمال الشراكة مع ASUS للوصول إلى الدعم المخصص
            </p>
            <Button asChild>
              <a href="/partner">ابدأ الشراكة مع ASUS</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">الدعم الفني</h1>
        <p className="text-gray-600">تواصل مع فريق الدعم أو استخدم المساعد الذكي</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Chat Assistant */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                المساعد الذكي
                <Badge variant="secondary" className="mr-auto">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-purple-600' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-2 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}>
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSending || !inputMessage.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Contacts */}
        <div className="space-y-6">
          {/* ASUS Support */}
          {hasAsusSupport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/partners/asus-logo.png" alt="ASUS" className="w-6 h-6" />
                  دعم ASUS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleContactSupport('asus', 'الهاتف')}
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    +966 XX XXX XXXX
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleContactSupport('asus', 'البريد')}
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    support@asus.com
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>متاح 24/7</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 text-sm">الموارد</h4>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="flex items-center justify-between text-sm text-purple-600 hover:text-purple-700"
                    >
                      <span>دليل المنتجات</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center justify-between text-sm text-purple-600 hover:text-purple-700"
                    >
                      <span>الأسئلة الشائعة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center justify-between text-sm text-purple-600 hover:text-purple-700"
                    >
                      <span>سياسة الإرجاع</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="w-4 h-4 ml-2" />
                فتح تذكرة دعم
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="w-4 h-4 ml-2" />
                عرض التذاكر السابقة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
