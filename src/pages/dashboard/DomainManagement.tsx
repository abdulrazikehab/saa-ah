import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Globe, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { coreApi } from '@/lib/api';

export default function DomainManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState<any>(null);
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    loadDomain();
  }, []);

  const loadDomain = async () => {
    try {
      const data = await coreApi.getDomain();
      setDomain(data);
    } catch (error: any) {
      // Silently fail - domain might not be set up yet
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await coreApi.addCustomDomain(customDomain);
      toast({
        title: 'تم الإرسال',
        description: 'تم إضافة النطاق المخصص. يرجى تكوين DNS.',
      });
      loadDomain();
      setCustomDomain('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر إضافة النطاق',
        description: 'حدث خطأ أثناء إضافة النطاق. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ النص إلى الحافظة',
    });
  };

  // Detect production domain from current hostname
  const prodDomain = window.location.hostname.includes('saeaa.net') ? 'saeaa.net' : 'saeaa.com';
  const defaultDomain = domain?.subdomain || `mystore.${prodDomain}`;
  const customDomainValue = domain?.customDomain || '';
  const isVerified = domain?.verified || false;

  const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState('');

  useEffect(() => {
    if (domain?.subdomain) {
      setNewSubdomain(domain.subdomain);
    }
  }, [domain]);

  const handleUpdateSubdomain = async () => {
    setLoading(true);
    try {
      await coreApi.updateCurrentUserTenant({ subdomain: newSubdomain });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث النطاق الفرعي بنجاح',
      });
      setIsEditingSubdomain(false);
      loadDomain();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'تعذر تحديث النطاق الفرعي',
        description: 'حدث خطأ أثناء تحديث النطاق الفرعي. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          إدارة النطاق
        </h1>
        <p className="text-muted-foreground text-lg">قم بإعداد نطاقك المخصص</p>
      </div>

      {/* Current Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            النطاق الحالي
          </CardTitle>
          <CardDescription>نطاق متجرك الافتراضي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            {isEditingSubdomain ? (
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2 flex-1">
                  <Input 
                    value={newSubdomain} 
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="subdomain"
                    className="max-w-[200px]"
                    dir="ltr"
                  />
                  <span className="text-muted-foreground text-sm" dir="ltr">.{prodDomain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleUpdateSubdomain} disabled={loading}>حفظ</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingSubdomain(false)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-lg" dir="ltr">{defaultDomain}</p>
                    <p className="text-sm text-muted-foreground">نطاقك الافتراضي</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewSubdomain(domain?.subdomain || '');
                      setIsEditingSubdomain(true);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`https://${defaultDomain}`)}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`https://${defaultDomain}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 ml-2" />
                      زيارة
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>نطاق مخصص</CardTitle>
          <CardDescription>اربط نطاقك الخاص بمتجرك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {customDomainValue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">{customDomainValue}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">تم التحقق</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-orange-600">في انتظار التحقق</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={isVerified ? 'default' : 'secondary'}>
                  {isVerified ? 'نشط' : 'معلق'}
                </Badge>
              </div>

              {!isVerified && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    يرجى تكوين سجلات DNS الخاصة بك. قد يستغرق التحقق حتى 48 ساعة.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customDomain">أدخل نطاقك</Label>
                <Input
                  id="customDomain"
                  type="text"
                  placeholder="www.mystore.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  أدخل النطاق الذي تريد استخدامه لمتجرك
                </p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الإضافة...' : 'إضافة نطاق'}
              </Button>
            </form>
          )}

          <Separator />

          {/* DNS Configuration Guide */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">خطوات تكوين DNS</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">سجل إلى لوحة تحكم مزود النطاق</p>
                  <p className="text-sm text-muted-foreground">
                    مثل GoDaddy، Namecheap، أو أي مزود آخر
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">أضف سجل CNAME</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono">Type: CNAME</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('CNAME')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono">Name: www</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('www')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono">Value: cname.{prodDomain}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`cname.${prodDomain}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">انتظر انتشار DNS</p>
                  <p className="text-sm text-muted-foreground">
                    قد يستغرق الأمر من بضع دقائق إلى 48 ساعة
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">تحقق من الحالة</p>
                  <p className="text-sm text-muted-foreground">
                    سنتحقق تلقائياً من نطاقك ونفعله عند اكتمال التكوين
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
