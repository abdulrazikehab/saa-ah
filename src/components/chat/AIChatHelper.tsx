import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { aiService } from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatHelperProps {
  context?: {
    currentPage?: string;
    currentSection?: string;
    userAction?: string;
  };
}

export function AIChatHelper({ context }: AIChatHelperProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === 'ar';
  
  // Only show AI helper for 'asus' tenant
  const isAsus = user?.tenantSubdomain === 'asus';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isArabic 
        ? 'مرحباً! أنا مساعد سِعَة الذكي. يمكنني مساعدتك في بناء صفحات رائعة، اقتراح المحتوى، والإجابة على أسئلتك حول منشئ الصفحات. كيف يمكنني مساعدتك اليوم؟'
        : 'Hi! I\'m Saa\'ah AI Assistant. I can help you build amazing pages, suggest content, and answer questions about the page builder. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiService.chat({
        message: userMessage,
        context,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = isArabic ? [
    { label: 'كيف أضيف قسم؟', action: 'كيف أضيف قسماً إلى صفحتي؟' },
    { label: 'أفكار محتوى', action: 'أعطني أفكار محتوى لصفحتي' },
    { label: 'أفضل الممارسات', action: 'ما هي أفضل الممارسات لتصميم الصفحات؟' },
  ] : [
    { label: 'How do I add a section?', action: 'How do I add a section to my page?' },
    { label: 'Content ideas', action: 'Give me content ideas for my page' },
    { label: 'Best practices', action: 'What are best practices for page design?' },
  ];

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  // Don't render for non-asus tenants
  // if (!isAsus) {
  //   return null;
  // }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-blue-200 dark:border-blue-800 ${isArabic ? 'left-6' : 'right-6'}`}>
          {/* Header */}
          <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold" style={{ fontFamily: 'Arial' }}>سِعَة</span>
                <span className="text-xs opacity-80">Saa'ah</span>
              </div>
              <Sparkles className="h-5 w-5" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 ${isArabic ? 'rtl' : 'ltr'}`}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? (isArabic ? 'justify-start' : 'justify-end') : (isArabic ? 'justify-end' : 'justify-start')}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className={`px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${isArabic ? 'rtl' : 'ltr'}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{isArabic ? 'إجراءات سريعة:' : 'Quick actions:'}</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((qa, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(qa.action)}
                    className="text-xs dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg ${isArabic ? 'rtl' : 'ltr'}`}>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isArabic ? 'اسألني أي شيء...' : 'Ask me anything...'}
                disabled={loading}
                className={`flex-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${isArabic ? 'text-right' : 'text-left'}`}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
