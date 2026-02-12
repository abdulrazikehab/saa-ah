import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, Link as LinkIcon, Menu, Loader2, MoveUp, MoveDown, Eye, Sparkles, PanelTop, Home, ShoppingBag, Users, Smartphone, FileText, Search, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NavLink {
  id: string;
  label: string;
  labelAr: string;
  url: string;
  openInNewTab: boolean;
  order: number;
  type?: 'link' | 'dropdown';
  children?: NavLink[];
}


interface NavigationConfig {
  header: {
    logo?: string;
    links: NavLink[];
  };
  footer: {
    links: NavLink[];
    socialMedia: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      youtube?: string;
      tiktok?: string;
    };
    copyrightText: string;
    copyrightTextAr: string;
  };
  sidebar: {
    links: NavLink[];
    title: string;
    titleAr: string;
    showPages: boolean;
  };
}

export default function NavigationEditor() {
  const { toast } = useToast();
  const [config, setConfig] = useState<NavigationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'header';
  const [navPages, setNavPages] = useState<any[]>([]);

  const loadConfig = useCallback(async () => {
    try {
      const [data, pagesData] = await Promise.all([
        coreApi.get('/site-config', { requireAuth: true }),
        coreApi.get('/public/navigation-pages', { requireAuth: false }).catch(() => ({ pages: [] }))
      ]);

      const pages = Array.isArray(pagesData) ? pagesData : (pagesData?.pages || []);
      setNavPages(pages);
      
      // Ensure proper structure with defaults
      const defaultConfig = {
        header: { links: [] },
        footer: {
          links: [],
          socialMedia: {},
          copyrightText: '© 2025 All rights reserved',
          copyrightTextAr: '© 2025 جميع الحقوق محفوظة'
        },
        sidebar: {
          links: [],
          title: 'Main Menu',
          titleAr: 'القائمة الرئيسية',
          showPages: true
        }
      };

      setConfig({
        header: {
          links: data?.header?.links || defaultConfig.header.links,
          logo: data?.header?.logo
        },
        footer: {
          links: data?.footer?.links || defaultConfig.footer.links,
          socialMedia: data?.footer?.socialMedia || defaultConfig.footer.socialMedia,
          copyrightText: data?.footer?.copyrightText || defaultConfig.footer.copyrightText,
          copyrightTextAr: data?.footer?.copyrightTextAr || defaultConfig.footer.copyrightTextAr
        },
        sidebar: {
          links: data?.sidebar?.links || defaultConfig.sidebar.links,
          title: data?.sidebar?.title || defaultConfig.sidebar.title,
          titleAr: data?.sidebar?.titleAr || defaultConfig.sidebar.titleAr,
          showPages: data?.sidebar?.showPages ?? defaultConfig.sidebar.showPages
        }
      });
    } catch (error) {
      console.error('Failed to load navigation config:', error);
      toast({
        title: 'تعذر تحميل إعدادات التنقل',
        description: 'حدث خطأ أثناء تحميل إعدادات التنقل. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const addHeaderLink = () => {
    if (!config) return;
    const newLink: NavLink = {
      id: Date.now().toString(),
      label: 'New Link',
      labelAr: 'رابط جديد',
      url: '/',
      openInNewTab: false,
      order: config.header.links.length,
      type: 'link',
      children: []
    };
    setConfig({
      ...config,
      header: {
        ...config.header,
        links: [...config.header.links, newLink],
      },
    });
  };

  const updateHeaderLink = (id: string, field: keyof NavLink, value: string | boolean | number | NavLink[]) => {
    if (!config) return;
    setConfig({
      ...config,
      header: {
        ...config.header,
        links: config.header.links.map(link =>
          link.id === id ? { ...link, [field]: value } : link
        ),
      },
    });
  };

  const removeHeaderLink = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      header: {
        ...config.header,
        links: config.header.links.filter(link => link.id !== id),
      },
    });
  };

  const moveHeaderLink = (id: string, direction: 'up' | 'down') => {
    if (!config) return;
    const links = [...config.header.links];
    const index = links.findIndex(link => link.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [links[index], links[index - 1]] = [links[index - 1], links[index]];
    } else if (direction === 'down' && index < links.length - 1) {
      [links[index], links[index + 1]] = [links[index + 1], links[index]];
    }

    // Update order
    links.forEach((link, idx) => {
      link.order = idx;
    });

    setConfig({
      ...config,
      header: { ...config.header, links },
    });
  };

  const addFooterLink = () => {
    if (!config) return;
    const newLink: NavLink = {
      id: Date.now().toString(),
      label: 'New Link',
      labelAr: 'رابط جديد',
      url: '/',
      openInNewTab: false,
      order: config.footer.links.length,
    };
    setConfig({
      ...config,
      footer: {
        ...config.footer,
        links: [...config.footer.links, newLink],
      },
    });
  };

  const updateFooterLink = (id: string, field: keyof NavLink, value: string | boolean | number) => {
    if (!config) return;
    setConfig({
      ...config,
      footer: {
        ...config.footer,
        links: config.footer.links.map(link =>
          link.id === id ? { ...link, [field]: value } : link
        ),
      },
    });
  };

  const removeFooterLink = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      footer: {
        ...config.footer,
        links: config.footer.links.filter(link => link.id !== id),
      },
    });
  };

  const moveFooterLink = (id: string, direction: 'up' | 'down') => {
    if (!config) return;
    const links = [...config.footer.links];
    const index = links.findIndex(link => link.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [links[index], links[index - 1]] = [links[index - 1], links[index]];
    } else if (direction === 'down' && index < links.length - 1) {
      [links[index], links[index + 1]] = [links[index + 1], links[index]];
    }

    links.forEach((link, idx) => {
      link.order = idx;
    });

    setConfig({
      ...config,
      footer: { ...config.footer, links },
    });
  };

  const addSidebarLink = () => {
    if (!config) return;
    const newLink: NavLink = {
      id: Date.now().toString(),
      label: 'New Link',
      labelAr: 'رابط جديد',
      url: '/',
      openInNewTab: false,
      order: config.sidebar.links.length,
    };
    setConfig({
      ...config,
      sidebar: {
        ...config.sidebar,
        links: [...config.sidebar.links, newLink],
      },
    });
  };

  const updateSidebarLink = (id: string, field: keyof NavLink, value: string | boolean | number) => {
    if (!config) return;
    setConfig({
      ...config,
      sidebar: {
        ...config.sidebar,
        links: config.sidebar.links.map(link =>
          link.id === id ? { ...link, [field]: value } : link
        ),
      },
    });
  };

  const removeSidebarLink = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      sidebar: {
        ...config.sidebar,
        links: config.sidebar.links.filter(link => link.id !== id),
      },
    });
  };

  const moveSidebarLink = (id: string, direction: 'up' | 'down') => {
    if (!config) return;
    const links = [...config.sidebar.links];
    const index = links.findIndex(link => link.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [links[index], links[index - 1]] = [links[index - 1], links[index]];
    } else if (direction === 'down' && index < links.length - 1) {
      [links[index], links[index + 1]] = [links[index + 1], links[index]];
    }

    links.forEach((link, idx) => {
      link.order = idx;
    });

    setConfig({
      ...config,
      sidebar: { ...config.sidebar, links },
    });
  };

  const updateSocialMedia = (platform: string, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      footer: {
        ...config.footer,
        socialMedia: {
          ...config.footer.socialMedia,
          [platform]: value,
        },
      },
    });
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // Validate and clean config before sending
      const cleanedConfig = {
        header: config.header || { links: [] },
        footer: config.footer || { links: [], socialMedia: {} },
        sidebar: config.sidebar || { links: [], title: 'Main Menu', titleAr: 'القائمة الرئيسية', showPages: true }
      };

      await coreApi.post('/site-config', cleanedConfig, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات التنقل بنجاح',
      });
    } catch (error: unknown) {
      console.error('Failed to save navigation config:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'data' in error)
          ? (error as { data?: { message?: string } }).data?.message || 'حدث خطأ أثناء حفظ إعدادات التنقل. يرجى المحاولة مرة أخرى.'
          : 'حدث خطأ أثناء حفظ إعدادات التنقل. يرجى المحاولة مرة أخرى.';
      toast({
        title: 'تعذر حفظ إعدادات التنقل',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة التنقل</h1>
          <p className="text-sm text-gray-500 mt-1">تخصيص قوائم الهيدر والفوتر</p>
        </div>
        <Button onClick={saveConfig} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <Tabs defaultValue={defaultTab} className="flex-1 w-full lg:max-w-3xl">
        <TabsList className="grid w-full max-w-sm grid-cols-3">
          <TabsTrigger value="header">قائمة الهيدر</TabsTrigger>
          <TabsTrigger value="sidebar">القائمة الجانبية</TabsTrigger>
          <TabsTrigger value="footer">قائمة الفوتر</TabsTrigger>
        </TabsList>

        {/* Header Links */}
        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Menu className="w-5 h-5" />
                    <CardTitle>روابط الهيدر</CardTitle>
                  </div>
                  <CardDescription className="mt-1">إدارة روابط التنقل في رأس الصفحة</CardDescription>
                </div>
                <Button onClick={addHeaderLink} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة رابط
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.header.links.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد روابط في الهيدر</p>
                  <Button onClick={addHeaderLink} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة أول رابط
                  </Button>
                </div>
              ) : (
                config?.header.links.map((link, index) => (
                  <div key={link.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">رابط #{index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveHeaderLink(link.id, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveHeaderLink(link.id, 'down')}
                          disabled={index === config.header.links.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHeaderLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">النص (English)</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateHeaderLink(link.id, 'label', e.target.value)}
                          placeholder="Home"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">النص (العربية)</Label>
                        <Input
                          value={link.labelAr}
                          onChange={(e) => updateHeaderLink(link.id, 'labelAr', e.target.value)}
                          placeholder="الرئيسية"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">النوع</Label>
                        <Select
                          value={link.type || 'link'}
                          onValueChange={(value: 'link' | 'dropdown') => updateHeaderLink(link.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">رابط مباشر</SelectItem>
                            <SelectItem value="dropdown">قائمة منسدلة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {link.type !== 'dropdown' && (
                        <div className="flex-[2]">
                          <Label className="text-xs">الرابط (URL)</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => updateHeaderLink(link.id, 'url', e.target.value)}
                            placeholder="/about"
                          />
                        </div>
                      )}
                    </div>

                    {link.type === 'dropdown' && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold">عناصر القائمة</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newChild: NavLink = {
                                id: Date.now().toString(),
                                label: 'New Item',
                                labelAr: 'عنصر جديد',
                                url: '/',
                                openInNewTab: false,
                                order: (link.children?.length || 0),
                                type: 'link'
                              };
                              const updatedChildren = [...(link.children || []), newChild];
                              updateHeaderLink(link.id, 'children', updatedChildren);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            إضافة عنصر
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {link.children?.map((child, childIdx) => (
                            <div key={child.id} className="flex gap-2 items-start">
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <Input
                                  value={child.label}
                                  onChange={(e) => {
                                    const updatedChildren = [...(link.children || [])];
                                    updatedChildren[childIdx] = { ...child, label: e.target.value };
                                    updateHeaderLink(link.id, 'children', updatedChildren);
                                  }}
                                  placeholder="Name"
                                  className="h-8 text-xs"
                                />
                                <Input
                                  value={child.labelAr}
                                  onChange={(e) => {
                                    const updatedChildren = [...(link.children || [])];
                                    updatedChildren[childIdx] = { ...child, labelAr: e.target.value };
                                    updateHeaderLink(link.id, 'children', updatedChildren);
                                  }}
                                  placeholder="الاسم"
                                  className="h-8 text-xs"
                                />
                                <Input
                                  value={child.url}
                                  onChange={(e) => {
                                    const updatedChildren = [...(link.children || [])];
                                    updatedChildren[childIdx] = { ...child, url: e.target.value };
                                    updateHeaderLink(link.id, 'children', updatedChildren);
                                  }}
                                  placeholder="URL"
                                  className="col-span-2 h-8 text-xs"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const updatedChildren = (link.children || []).filter((_, i) => i !== childIdx);
                                  updateHeaderLink(link.id, 'children', updatedChildren);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          {(!link.children || link.children.length === 0) && (
                            <p className="text-xs text-gray-500 text-center py-2">لا يوجد عناصر</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Links */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    <CardTitle>روابط الفوتر</CardTitle>
                  </div>
                  <CardDescription className="mt-1">إدارة روابط التنقل في أسفل الصفحة</CardDescription>
                </div>
                <Button onClick={addFooterLink} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة رابط
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.footer.links.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد روابط في الفوتر</p>
                  <Button onClick={addFooterLink} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة أول رابط
                  </Button>
                </div>
              ) : (
                config?.footer.links.map((link, index) => (
                  <div key={link.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">رابط #{index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveFooterLink(link.id, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveFooterLink(link.id, 'down')}
                          disabled={index === config.footer.links.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFooterLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">النص (English)</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateFooterLink(link.id, 'label', e.target.value)}
                          placeholder="About Us"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">النص (العربية)</Label>
                        <Input
                          value={link.labelAr}
                          onChange={(e) => updateFooterLink(link.id, 'labelAr', e.target.value)}
                          placeholder="من نحن"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">الرابط (URL)</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateFooterLink(link.id, 'url', e.target.value)}
                        placeholder="/about"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>روابط التواصل الاجتماعي</CardTitle>
              <CardDescription>أضف روابط حساباتك على وسائل التواصل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Facebook</Label>
                <Input
                  value={config?.footer.socialMedia.facebook || ''}
                  onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <Label>Twitter / X</Label>
                <Input
                  value={config?.footer.socialMedia.twitter || ''}
                  onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={config?.footer.socialMedia.instagram || ''}
                  onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div>
                <Label>YouTube</Label>
                <Input
                  value={config?.footer.socialMedia.youtube || ''}
                  onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
              <div>
                <Label>TikTok</Label>
                <Input
                  value={config?.footer.socialMedia.tiktok || ''}
                  onChange={(e) => updateSocialMedia('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/@yourhandle"
                />
              </div>
            </CardContent>
          </Card>

          {/* Copyright */}
          <Card>
            <CardHeader>
              <CardTitle>نص حقوق الطبع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Copyright Text (English)</Label>
                <Input
                  value={config?.footer.copyrightText || ''}
                  onChange={(e) => setConfig(config ? {
                    ...config,
                    footer: { ...config.footer, copyrightText: e.target.value }
                  } : null)}
                  placeholder="© 2025 All rights reserved"
                />
              </div>
              <div>
                <Label>نص حقوق الطبع (العربية)</Label>
                <Input
                  value={config?.footer.copyrightTextAr || ''}
                  onChange={(e) => setConfig(config ? {
                    ...config,
                    footer: { ...config.footer, copyrightTextAr: e.target.value }
                  } : null)}
                  placeholder="© 2025 جميع الحقوق محفوظة"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sidebar Links */}
        <TabsContent value="sidebar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Menu className="w-5 h-5" />
                    <CardTitle>روابط القائمة الجانبية</CardTitle>
                  </div>
                  <CardDescription className="mt-1">إدارة روابط القائمة الجانبية للمتجر</CardDescription>
                </div>
                <Button onClick={addSidebarLink} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة رابط
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                      <Label>عنوان القائمة (English)</Label>
                      <Input 
                        value={config?.sidebar.title} 
                        onChange={(e) => setConfig(prev => prev ? { ...prev, sidebar: { ...prev.sidebar, title: e.target.value } } : null)}
                      />
                  </div>
                  <div>
                      <Label>عنوان القائمة (العربية)</Label>
                      <Input 
                        value={config?.sidebar.titleAr} 
                        onChange={(e) => setConfig(prev => prev ? { ...prev, sidebar: { ...prev.sidebar, titleAr: e.target.value } } : null)}
                      />
                  </div>
              </div>

              {config?.sidebar.links.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Menu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد روابط مخصصة في القائمة الجانبية</p>
                </div>
              ) : (
                config?.sidebar.links.map((link, index) => (
                  <div key={link.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">رابط #{index + 1}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSidebarLink(link.id, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveSidebarLink(link.id, 'down')}
                          disabled={index === config.sidebar.links.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSidebarLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">النص (English)</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateSidebarLink(link.id, 'label', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">النص (العربية)</Label>
                        <Input
                          value={link.labelAr}
                          onChange={(e) => updateSidebarLink(link.id, 'labelAr', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">الرابط (URL)</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateSidebarLink(link.id, 'url', e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Pane */}
      <div className="hidden lg:block w-96 sticky top-24 shrink-0">
          <Card className="overflow-hidden border-2 shadow-2xl h-[700px] flex flex-col bg-gray-50">
              <CardHeader className="bg-white border-b py-3 px-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold uppercase tracking-wider">Live Preview</span>
                      </div>
                      <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                  </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                  <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
                      {config?.header.logo ? (
                          <img src={config.header.logo} alt="Logo" className="h-6 w-auto object-contain" />
                      ) : (
                          <div className="font-black text-[10px] text-primary uppercase flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              BlackBox Store
                          </div>
                      )}
                      <div className="flex items-center gap-3">
                          <div className="hidden md:flex gap-3">
                              {config?.header.links.slice(0, 4).map((link, i) => (
                                  <span key={i} className="text-[9px] font-bold text-gray-600 hover:text-primary transition-colors cursor-default whitespace-nowrap">{link.labelAr}</span>
                              ))}
                          </div>
                          <div className="flex items-center gap-2 border-l pl-2 ml-1 border-gray-100">
                             <Search className="w-3 h-3 text-gray-400" />
                             <ShoppingBag className="w-3 h-3 text-gray-400" />
                             <Menu className="w-3 h-3 text-gray-600" />
                          </div>
                      </div>
                  </div>

                  {/* Main Preview Area */}
                  <div className="flex-1 flex">
                      {/* Sidebar Preview Overlay (only if tab is sidebar) */}
                      <div className={`w-3/4 h-full bg-white shadow-2xl z-20 border-r transition-transform duration-300 ${searchParams.get('tab') === 'sidebar' ? 'translate-x-0' : '-translate-x-full absolute'}`}>
                          <div className="p-4 bg-primary text-white">
                              <h4 className="font-bold text-sm">{config?.sidebar.titleAr}</h4>
                          </div>
                          <div className="p-2 space-y-1">
                              {config?.sidebar.links.map((link, i) => (
                                  <div key={i} className="p-2 text-xs font-semibold text-gray-700 hover:bg-muted rounded-lg flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      {link.labelAr}
                                  </div>
                              ))}
                              {config?.sidebar.showPages && (
                                  <div className="mt-4 pt-4 border-t space-y-1">
                                      <div className="p-2 text-[10px] text-primary font-bold flex items-center gap-2 bg-primary/5 rounded">
                                           <Home className="h-3 w-3" />
                                           الرئيسية
                                      </div>
                                      <div className="p-2 text-[10px] text-gray-600 font-bold flex items-center gap-2">
                                           <ShoppingBag className="h-3 w-3" />
                                           المنتجات
                                      </div>
                                      {navPages.filter(p => p.slug !== 'home' && p.slug !== 'products').slice(0, 5).map((p, i) => (
                                          <div key={i} className="p-2 text-[10px] text-gray-500 flex items-center gap-2">
                                              <FileText className="h-3 w-3 opacity-30" />
                                              {p.titleAr || p.title}
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900 text-sm">Your Site Preview</h3>
                              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Changes you make on the left will appear here instantly.</p>
                          </div>
                      </div>
                  </div>

                  {/* Mock Footer */}
                  <div className="bg-gray-900 text-white p-5 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1">Quick Links</div>
                               {config?.footer.links.length > 0 ? (
                                   config?.footer.links.slice(0, 4).map((link, i) => (
                                       <div key={i} className="text-[8px] text-gray-300 flex items-center gap-1.5">
                                           <div className="w-1 h-1 rounded-full bg-gray-500" />
                                           {link.labelAr}
                                       </div>
                                   ))
                               ) : (
                                   <div className="text-[8px] text-gray-500 italic">No links added</div>
                               )}
                           </div>
                           <div className="space-y-2">
                               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1">Follow Us</div>
                               <div className="flex flex-wrap gap-1.5 pt-1">
                                   {Object.entries(config?.footer.socialMedia || {}).map(([key, val], i) => val && (
                                       <div key={i} className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[7px] uppercase hover:bg-primary/50 transition-colors" title={key}>
                                           {key[0]}
                                       </div>
                                   ))}
                                   {(!config?.footer.socialMedia || Object.values(config.footer.socialMedia).every(v => !v)) && (
                                       <div className="text-[8px] text-gray-500 italic">No social links</div>
                                   )}
                               </div>
                           </div>
                       </div>
                       <div className="pt-4 border-t border-white/10 text-center text-[7px] text-gray-500">
                           {config?.footer.copyrightTextAr}
                       </div>
                  </div>
              </div>
          </Card>
      </div>
      </div>

      {/* Save Button (Sticky) */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={saveConfig} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
