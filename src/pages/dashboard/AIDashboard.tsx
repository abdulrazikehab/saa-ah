import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Search, Mic, Image as ImageIcon, Video, 
  FileText, Code, Home, Loader2, Send, Zap,
  Play, Camera, Music, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AITool {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
  category: 'media' | 'writing' | 'all';
  color: string;
}

const aiTools: AITool[] = [
  {
    id: 'audio',
    title: 'Create Audio',
    titleAr: 'إنشاء صوت',
    description: 'Convert your product descriptions into professional audio recordings',
    descriptionAr: 'حول وصف منتجاتك إلى التسجيل صوتي احترافي',
    icon: Mic,
    category: 'media',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'image',
    title: 'Create Images',
    titleAr: 'إنشاء صور',
    description: 'Create professional product images in seconds',
    descriptionAr: 'انشئ صور منتجات احترافية خلال ثوان',
    icon: ImageIcon,
    category: 'media',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'video',
    title: 'Create Video',
    titleAr: 'إنشاء فيديو',
    description: 'Create attractive promotional videos for your products',
    descriptionAr: 'انشئ فيديوهات ترويجية جذابة لمنتجاتك',
    icon: Video,
    category: 'media',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'gpt',
    title: 'Koun GPT',
    titleAr: 'كون GPT',
    description: 'Your smart assistant for professional store management and creation',
    descriptionAr: 'مساعدك الذكي الإدارة وإنشاء متحرك باحتراف',
    icon: Sparkles,
    category: 'all',
    color: 'from-primary to-secondary'
  }
];

export default function AIDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [activeCategory, setActiveCategory] = useState<'all' | 'media' | 'writing'>('all');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(290);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = activeCategory === 'all' 
    ? aiTools 
    : aiTools.filter(tool => tool.category === activeCategory || tool.category === 'all');

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    inputRef.current?.focus();
  };

  const handleCreate = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const response = await aiService.chat({
        message: input,
        context: {
          currentPage: 'ai-dashboard',
          tool: selectedTool,
          action: 'create_content'
        } as unknown as Record<string, unknown>
      });

      toast({
        title: isRTL ? 'تم الإنشاء بنجاح' : 'Created Successfully',
        description: isRTL ? 'تم إنشاء المحتوى بنجاح' : 'Content created successfully',
      });

      setInput('');
      setSelectedTool(null);
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (isRTL ? 'حدث خطأ أثناء الإنشاء' : 'An error occurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.div
          initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-64 bg-gray-900/50 border-l border-gray-800/50 p-6 flex flex-col"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">كون AI</h2>
                <p className="text-xs text-gray-400">Koun AI</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'home', label: 'الرئيسية', labelEn: 'Home', icon: Home },
              { id: 'media', label: 'الميديا', labelEn: 'Media', icon: Camera },
              { id: 'writing', label: 'الكتابة', labelEn: 'Writing', icon: FileText },
              { id: 'programming', label: 'البرمجة', labelEn: 'Programming', icon: Code },
            ].map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-right",
                  selectedTool === item.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
                onClick={() => {
                  if (item.id === 'media') setActiveCategory('media');
                  else if (item.id === 'writing') setActiveCategory('writing');
                  else setActiveCategory('all');
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{isRTL ? item.label : item.labelEn}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-800/50">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-4 border border-primary/30">
              <p className="text-xs text-gray-400 mb-2">{isRTL ? 'كون GPT' : 'Koun GPT'}</p>
              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isRTL ? 'ابدأ' : 'Start'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900/30 border-b border-gray-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {isRTL ? 'الرصيد المتبقي' : 'Remaining Balance'}: <span className="text-primary font-bold">{balance}</span>
                </p>
                <h1 className="text-2xl font-bold">{isRTL ? 'لوحة تحكم المتجر' : 'Store Control Panel'}</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={isRTL ? 'ابحث عن أداة معينة' : 'Search for a specific tool'}
                    className="w-64 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <span className="font-bold text-lg">سعة AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              {/* Question */}
              <h2 className="text-3xl font-bold mb-8 text-center">
                {isRTL ? 'ماذا تريد ان تنشئ لمتجرك اليوم ؟' : 'What do you want to create for your store today?'}
              </h2>

              {/* Category Tabs */}
              <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
                {[
                  { id: 'all', label: 'الكل', labelEn: 'All' },
                  { id: 'media', label: 'ميديا', labelEn: 'Media' },
                  { id: 'writing', label: 'كتابة محتوى', labelEn: 'Content Writing' },
                  { id: 'gpt', label: 'كون GPT', labelEn: 'Koun GPT' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'gpt') {
                        setSelectedTool('gpt');
                        setActiveCategory('all');
                      } else {
                        setActiveCategory(tab.id as 'all' | 'media' | 'writing');
                        setSelectedTool(null);
                      }
                    }}
                    className={cn(
                      "px-6 py-2 rounded-full font-semibold transition-all",
                      (tab.id === 'gpt' && selectedTool === 'gpt') || (tab.id !== 'gpt' && activeCategory === tab.id)
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    {isRTL ? tab.label : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* AI Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <Card
                        className={cn(
                          "bg-gray-800/50 border-gray-700 hover:border-primary/50 transition-all cursor-pointer h-full",
                          selectedTool === tool.id && "border-primary bg-primary/10"
                        )}
                        onClick={() => handleToolSelect(tool.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                              "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                              `bg-gradient-to-br ${tool.color}`
                            )}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            {selectedTool === tool.id && (
                              <Badge className="bg-primary text-white">
                                {isRTL ? 'محدد' : 'Selected'}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2">
                            {isRTL ? tool.titleAr : tool.title}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {isRTL ? tool.descriptionAr : tool.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            className={cn(
                              "w-full",
                              selectedTool === tool.id
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-gray-700 hover:bg-gray-600"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToolSelect(tool.id);
                            }}
                          >
                            {isRTL ? 'ابدأ' : 'Start'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Input Section */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCreate();
                          }
                        }}
                        placeholder={isRTL ? 'أنشئ ش...' : 'Create sh...'}
                        className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-12"
                      />
                      <button
                        onClick={handleCreate}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                      >
                        <Zap className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                        onClick={() => {
                          setInput(isRTL ? 'انشاء صورة منتج' : 'Create product image');
                          handleToolSelect('image');
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {isRTL ? 'صورة منتج' : 'Product Image'}
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                        onClick={() => {
                          setInput(isRTL ? 'تحويل صورة لفيديو' : 'Convert image to video');
                          handleToolSelect('video');
                        }}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {isRTL ? 'صورة لفيديو' : 'Image to Video'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

