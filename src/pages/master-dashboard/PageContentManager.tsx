import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, FileText, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PageContent {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

interface PageContentManagerProps {
  adminApiKey: string;
}

export default function PageContentManager({ adminApiKey }: PageContentManagerProps) {
  const [activePage, setActivePage] = useState('about');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PageContent>({
    titleAr: '',
    titleEn: '',
    contentAr: '',
    contentEn: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchContent = async (slug: string) => {
      setLoading(true);
      try {
        const response = await coreApi.get(`/public/pages/${slug}`);
        if (response?.content) {
          setContent(response.content);
        } else {
          // Defaults
          setContent({
            titleAr: slug === 'about' ? 'من نحن' : slug === 'contact' ? 'تواصل معنا' : 'سياسة الخصوصية',
            titleEn: slug === 'about' ? 'About Us' : slug === 'contact' ? 'Contact Us' : 'Privacy Policy',
            contentAr: '',
            contentEn: '',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load page content',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent(activePage);
  }, [activePage, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await coreApi.put(`/admin/master/pages/${activePage}`, content, {
        requireAuth: true,
        adminApiKey,
      });
      toast({
        title: 'Success',
        description: 'Page content updated successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update page content',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Page Content</h2>
          <p className="text-muted-foreground">Manage content for static pages (About, Contact, Privacy)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Pages</CardTitle>
            <CardDescription>Select a page to edit</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {[
                { id: 'about', label: 'About Us / من نحن' },
                { id: 'contact', label: 'Contact / تواصل معنا' },
                { id: 'privacy', label: 'Privacy Policy / سياسة الخصوصية' },
              ].map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors hover:bg-muted/50 text-left ${
                    activePage === page.id ? 'bg-muted border-l-4 border-primary' : 'border-l-4 border-transparent'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  {page.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="capitalize">{activePage} Page Content</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="ar" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="ar" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Arabic
                  </TabsTrigger>
                  <TabsTrigger value="en" className="gap-2">
                    <Globe className="h-4 w-4" />
                    English
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ar" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Page Title (Arabic)</Label>
                    <Input
                      value={content.titleAr}
                      onChange={(e) => setContent({ ...content, titleAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content (Arabic)</Label>
                    <Textarea
                      value={content.contentAr}
                      onChange={(e) => setContent({ ...content, contentAr: e.target.value })}
                      className="min-h-[400px] font-mono"
                      dir="rtl"
                      placeholder="Enter HTML content here..."
                    />
                    <p className="text-xs text-muted-foreground">Supports HTML tags for formatting.</p>
                  </div>
                </TabsContent>

                <TabsContent value="en" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Page Title (English)</Label>
                    <Input
                      value={content.titleEn}
                      onChange={(e) => setContent({ ...content, titleEn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content (English)</Label>
                    <Textarea
                      value={content.contentEn}
                      onChange={(e) => setContent({ ...content, contentEn: e.target.value })}
                      className="min-h-[400px] font-mono"
                      placeholder="Enter HTML content here..."
                    />
                    <p className="text-xs text-muted-foreground">Supports HTML tags for formatting.</p>
                  </div>
                </TabsContent>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
