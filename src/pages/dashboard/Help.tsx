import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, Mail, Phone, MessageSquare, Book, Video, FileText } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AIChatHelper } from '@/components/chat/AIChatHelper';

export default function Help() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'تم إرسال الرسالة',
      description: 'سنتواصل معك في أقرب وقت ممكن',
    });
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const faqs = [
    {
      question: 'كيف أضيف منتج جديد؟',
      answer: 'انتقل إلى صفحة المنتجات من القائمة الجانبية، ثم اضغط على زر "إضافة منتج". املأ جميع التفاصيل المطلوبة مثل الاسم والسعر والوصف، ثم احفظ المنتج.',
    },
    {
      question: 'كيف أغير إعدادات المتجر؟',
      answer: 'اذهب إلى "إعدادات المتجر" من القائمة الجانبية. ستجد جميع الإعدادات مقسمة إلى تبويبات: عام، معلومات الاتصال، إعدادات الأعمال، الدفع والشحن، ومتقدم.',
    },
    {
      question: 'كيف أتابع الطلبات؟',
      answer: 'في صفحة الطلبات، يمكنك رؤية جميع الطلبات وحالتها. يمكنك تحديث حالة الطلب، إضافة رقم التتبع، وطباعة الفاتورة.',
    },
    {
      question: 'كيف أضيف موظفين؟',
      answer: 'من صفحة "إدارة المتجر"، اختر تبويب "الموظفين"، ثم اضغط على "إضافة موظف". حدد الدور الوظيفي والصلاحيات المناسبة.',
    },
    {
      question: 'كيف أربط نطاقي الخاص؟',
      answer: 'اذهب إلى صفحة "النطاق" وأضف نطاقك المخصص. ستحتاج إلى تحديث سجلات DNS لدى مزود النطاق الخاص بك.',
    },
    {
      question: 'كيف أفعل طرق الدفع؟',
      answer: 'في "إعدادات المتجر"، اختر تبويب "الدفع والشحن". يمكنك تفعيل الدفع عند الاستلام، البطاقات الائتمانية، أو التحويل البنكي.',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">المساعدة والدعم</h1>
        <p className="text-muted-foreground mt-2">نحن هنا لمساعدتك في أي وقت</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Book className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">دليل الاستخدام</h3>
              <p className="text-sm text-muted-foreground">تعلم كيفية استخدام جميع الميزات</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Video className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">فيديوهات تعليمية</h3>
              <p className="text-sm text-muted-foreground">شاهد شروحات مصورة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">الوثائق</h3>
              <p className="text-sm text-muted-foreground">اقرأ الوثائق التقنية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            الأسئلة الشائعة
          </CardTitle>
          <CardDescription>إجابات على الأسئلة الأكثر شيوعاً</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-right">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            تواصل مع الدعم
          </CardTitle>
          <CardDescription>لم تجد إجابة لسؤالك؟ راسلنا مباشرة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">الموضوع</Label>
              <Input
                id="subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              إرسال الرسالة
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">طرق التواصل الأخرى</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>support@saa'ah.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>+966 50 123 4567</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Helper */}
      <AIChatHelper 
        context={{
          currentPage: 'Help & Support',
          userAction: 'Seeking help or documentation',
        }}
      />
    </div>
  );
}
