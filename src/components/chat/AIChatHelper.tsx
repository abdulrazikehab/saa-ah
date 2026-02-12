import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { aiService } from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { RobotFaceHelper } from '@/components/common/RobotFaceHelper';

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
  const [showRobotMessage, setShowRobotMessage] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isArabic 
        ? 'مرحباً! أنا مساعد كون الذكي. يمكنني مساعدتك في بناء صفحات رائعة، اقتراح المحتوى، والإجابة على أسئلتك حول منشئ الصفحات. كيف يمكنني مساعدتك اليوم؟'
        : 'Hi! I\'m Koun AI Assistant. I can help you build amazing pages, suggest content, and answer questions about the page builder. How can I help you today?'
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

  // Handle robot message visibility
  useEffect(() => {
    // Show message after 1.5 seconds
    const showTimer = setTimeout(() => {
      if (!isOpen) setShowRobotMessage(true);
    }, 1500);
    
    // Hide message after 5 seconds of being shown (total 6.5s)
    const hideTimer = setTimeout(() => {
      setShowRobotMessage(false);
    }, 6500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen]);

  // Hide robot message when chat is opened
  useEffect(() => {
    if (isOpen) {
      setShowRobotMessage(false);
    }
  }, [isOpen]);

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
      <AnimatePresence>
        {!isOpen && (
          <div className={`fixed bottom-24 z-50 flex items-end gap-6 pointer-events-none ${isArabic ? 'left-8 flex-row-reverse' : 'right-8 flex-row'}`}>
            
            {/* Robot Message Bubble */}
            {showRobotMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className={`bg-white dark:bg-slate-800 text-foreground p-4 rounded-2xl shadow-xl border border-border mb-2 relative max-w-[250px] pointer-events-auto ${isArabic ? 'ml-2 rounded-bl-sm' : 'mr-2 rounded-br-sm'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full shrink-0">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {isArabic ? 'هل تحتاج إلى مساعدة في شيء؟' : 'Do you need help with anything?'}
                    </p>
                    <button 
                      onClick={() => setIsOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 font-semibold"
                    >
                      {isArabic ? 'تحدث معي الآن' : 'Chat with me now'}
                    </button>
                  </div>
                </div>
                {/* Close small button */}
                <button 
                  onClick={() => setShowRobotMessage(false)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {/* Floating Trigger Button - Robot Face */}
            <motion.div
              className="pointer-events-auto relative cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
            >
              <RobotFaceHelper
                mood={showRobotMessage ? 'wink' : 'happy'}
                size="xs"
                autoChangeMood={false}
                isArabic={isArabic}
                followMouse={true}
              />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white shadow-sm"></span>
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 w-96 h-[600px] z-50 ${isArabic ? 'left-6' : 'right-6'}`}
          >
            <Card className="h-full shadow-2xl flex flex-col border-2 border-blue-200 dark:border-blue-800 bg-background overflow-hidden rounded-2xl">
              {/* Header */}
              <div className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <RobotFaceHelper
                    mood={loading ? 'thinking' : 'happy'}
                    size="sm"
                    isArabic={isArabic}
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">كون AI</span>
                      <span className="text-xs bg-cyan-500/30 px-1.5 py-0.5 rounded text-cyan-200">BETA</span>
                    </div>
                    <p className="text-xs text-white/80">{isArabic ? 'مساعدك الذكي الشخصي' : 'Your personal AI assistant'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 ${isArabic ? 'rtl' : 'ltr'}`}>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? (isArabic ? 'justify-start' : 'justify-end') : (isArabic ? 'justify-end' : 'justify-start')}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-card border border-border dark:text-foreground rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'}`}>
                    <div className="bg-white dark:bg-card border border-border rounded-2xl rounded-bl-none p-4 shadow-sm">
                      <div className="flex gap-1">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className={`px-4 py-3 border-t border-border bg-background ${isArabic ? 'rtl' : 'ltr'}`}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isArabic ? 'اقتراحات سريعة:' : 'Quick suggestions:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((qa, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(qa.action)}
                        className="text-xs h-8 bg-muted/50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors"
                      >
                        {qa.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className={`p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isArabic ? 'rtl' : 'ltr'}`}>
                <div className="relative flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    disabled={loading}
                    className={`flex-1 pr-4 py-6 rounded-xl border-border focus-visible:ring-blue-500 shadow-inner bg-muted/30 ${isArabic ? 'text-right' : 'text-left'}`}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 shrink-0"
                  >
                    <Send className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

