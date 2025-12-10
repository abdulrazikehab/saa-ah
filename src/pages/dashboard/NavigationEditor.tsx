import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, Link as LinkIcon, Menu, Loader2, MoveUp, MoveDown } from 'lucide-react';
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
}

export default function NavigationEditor() {
  const { toast } = useToast();
  const [config, setConfig] = useState<NavigationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const data = await coreApi.get('/site-config', { requireAuth: true });
      
      // Ensure proper structure with defaults
      const defaultConfig = {
        header: { links: [] },
        footer: {
          links: [],
          socialMedia: {},
          copyrightText: '© 2025 All rights reserved',
          copyrightTextAr: '© 2025 جميع الحقوق محفوظة'
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
        }
      });
    } catch (error) {
      console.error('Failed to load navigation config:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل إعدادات التنقل',
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
      await coreApi.post('/site-config', config, { requireAuth: true });
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات التنقل بنجاح',
      });
    } catch (error) {
      console.error('Failed to save navigation config:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ إعدادات التنقل',
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

      {/* Tabs */}
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="header">قائمة الهيدر</TabsTrigger>
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
      </Tabs>

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
