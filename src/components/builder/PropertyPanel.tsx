import { useState, useEffect } from 'react';
import { Section } from './PageBuilder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2, Type, Layout, Palette, Settings, AlignLeft, AlignCenter, AlignRight, Code, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Editor from '@monaco-editor/react';
import { ImageUpload } from '@/components/ui/image-upload';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { coreApi } from '@/lib/api';


interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface ContentSliderItem {
  id?: string;
  icon?: string;
  title?: string;
  description?: string;
}

interface TestimonialItem {
  id?: string;
  name?: string;
  role?: string;
  text?: string;
  rating?: number;
  image?: string;
}

interface PricingPlan {
  id?: string;
  name?: string;
  price?: string;
  currency?: string;
  period?: string;
  highlighted?: boolean;
  features?: string[];
}

interface TeamMember {
  id?: string;
  name?: string;
  role?: string;
  bio?: string;
  image?: string;
}

interface StatItem {
  id?: string;
  number?: string;
  suffix?: string;
  label?: string;
}

interface FAQItem {
  id?: string;
  question?: string;
  answer?: string;
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FooterLink {
  label: string;
  url: string;
}

interface PropertyPanelProps {
  section: Section;
  onUpdate: (props: Record<string, unknown>) => void;
  onClose: () => void;
}

export const PropertyPanel = ({ section, onUpdate, onClose }: PropertyPanelProps) => {
  const { type, props } = section;
  const { t } = useTranslation();
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editorMounted, setEditorMounted] = useState(false);

  const handleOpenCodeEditor = () => {
    setCodeEditorValue(JSON.stringify(props, null, 2));
    setShowCodeEditor(true);
    setEditorMounted(false);
  };

  const handleApplyCodeChanges = () => {
    try {
      const parsed = JSON.parse(codeEditorValue);
      onUpdate(parsed);
      setShowCodeEditor(false);
    } catch (error) {
      console.error('Invalid JSON:', error);
      // Ideally show a toast here, but we don't have toast imported in this component
      // We can rely on the Monaco editor validation or just fail silently/log for now
    }
  };

  useEffect(() => {
    if (type === 'products') {
      const fetchCategories = async () => {
        try {
          const data = await coreApi.getCategories();
          // Validate data is not an error object
          if (data && typeof data === 'object') {
            if (Array.isArray(data)) {
              const validCategories = data.filter((c: unknown) => 
                c && typeof c === 'object' && 'id' in c && !('error' in c) && !('statusCode' in c)
              );
              setCategories(validCategories);
            } else if (data.categories && Array.isArray(data.categories)) {
              const validCategories = data.categories.filter((c: unknown) => 
                c && typeof c === 'object' && 'id' in c && !('error' in c) && !('statusCode' in c)
              );
              setCategories(validCategories);
            } else {
              setCategories([]);
            }
          } else {
            setCategories([]);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
          setCategories([]);
        }
      };
      fetchCategories();
    }
  }, [type]);

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ ...props, [key]: value });
  };

  const handleNestedChange = (parentKey: string, index: number, key: string, value: unknown) => {
    const items = [...(props[parentKey] as unknown[])];
    items[index] = { ...(items[index] as object), [key]: value };
    handleChange(parentKey, items);
  };

  const handleAddItem = (parentKey: string, defaultItem: unknown) => {
    const items = [...(props[parentKey] as unknown[] || [])];
    items.push(defaultItem);
    handleChange(parentKey, items);
  };

  const handleRemoveItem = (parentKey: string, index: number) => {
    const items = [...(props[parentKey] as unknown[])];
    items.splice(index, 1);
    handleChange(parentKey, items);
  };

  const renderStyleFields = () => (
    <div className="space-y-6">
      {/* Colors */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-500 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          {t('properties.colors', 'Colors')}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1.5 block">{t('properties.background', 'Background')}</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full border overflow-hidden shrink-0">
                <input
                  type="color"
                  value={(props.backgroundColor as string) || '#ffffff'}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-[150%] h-[150%] -m-[25%] cursor-pointer"
                />
              </div>
              <Input
                value={(props.backgroundColor as string) || '#ffffff'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">{t('properties.text', 'Text')}</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full border overflow-hidden shrink-0">
                <input
                  type="color"
                  value={(props.textColor as string) || '#000000'}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="w-[150%] h-[150%] -m-[25%] cursor-pointer"
                />
              </div>
              <Input
                value={(props.textColor as string) || '#000000'}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-500 flex items-center gap-2">
          <Layout className="w-4 h-4" />
          {t('properties.spacing', 'Spacing')}
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-xs">{t('properties.paddingTopBottom', 'Vertical Padding')}</Label>
              <span className="text-xs text-gray-500">{(props.paddingY as number) || 4}rem</span>
            </div>
            <Slider
              value={[(props.paddingY as number) || 4]}
              min={0}
              max={10}
              step={0.5}
              onValueChange={([val]) => handleChange('paddingY', val)}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-500 flex items-center gap-2">
          <Type className="w-4 h-4" />
          {t('properties.typography', 'Typography')}
        </h4>
        
        {/* Text Alignment */}
        <div>
          <Label className="text-xs mb-1.5 block">{t('properties.textAlignment', 'Text Alignment')}</Label>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1 w-fit">
            <Button
              variant={props.textAlign === 'left' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleChange('textAlign', 'left')}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={props.textAlign === 'center' || !props.textAlign ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleChange('textAlign', 'center')}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={props.textAlign === 'right' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleChange('textAlign', 'right')}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Position */}
        <div>
          <Label className="text-xs mb-1.5 block">{t('properties.contentPosition', 'Content Position')}</Label>
          <Select
            value={(props.contentPosition as string) || 'center'}
            onValueChange={(value) => handleChange('contentPosition', value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">{t('properties.position.top', 'Top')}</SelectItem>
              <SelectItem value="center">{t('properties.position.center', 'Center')}</SelectItem>
              <SelectItem value="bottom">{t('properties.position.bottom', 'Bottom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex justify-between mb-1.5">
            <Label className="text-xs">{t('properties.fontSize', 'Font Size')}</Label>
            <span className="text-xs text-gray-500">{(props.fontSize as number) || 16}px</span>
          </div>
          <Slider
            value={[(props.fontSize as number) || 16]}
            min={12}
            max={72}
            step={1}
            onValueChange={([val]) => handleChange('fontSize', val)}
          />
        </div>

        {/* Font Weight */}
        <div>
          <Label className="text-xs mb-1.5 block">{t('properties.fontWeight', 'Font Weight')}</Label>
          <Select
            value={(props.fontWeight as string) || 'normal'}
            onValueChange={(value) => handleChange('fontWeight', value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('properties.weight.light', 'Light')}</SelectItem>
              <SelectItem value="normal">{t('properties.weight.normal', 'Normal')}</SelectItem>
              <SelectItem value="medium">{t('properties.weight.medium', 'Medium')}</SelectItem>
              <SelectItem value="semibold">{t('properties.weight.semibold', 'Semi Bold')}</SelectItem>
              <SelectItem value="bold">{t('properties.weight.bold', 'Bold')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div>
          <div className="flex justify-between mb-1.5">
            <Label className="text-xs">{t('properties.lineHeight', 'Line Height')}</Label>
            <span className="text-xs text-gray-500">{(props.lineHeight as number) || 1.5}</span>
          </div>
          <Slider
            value={[(props.lineHeight as number) || 1.5]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={([val]) => handleChange('lineHeight', val)}
          />
        </div>
      </div>

      {/* Background Image */}
      <div className="space-y-2">
        <Label className="text-xs">{t('properties.backgroundImage', 'Background Image')}</Label>
        <ImageUpload
          value={props.backgroundImage as string}
          onChange={(url) => handleChange('backgroundImage', url)}
          placeholder={t('properties.uploadBackground', 'Upload background')}
        />
      </div>
    </div>
  );

  const renderSettingsFields = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-500 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('properties.animation', 'Animation')}
        </h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block">{t('properties.animationType', 'Type')}</Label>
            <Select
              value={(props.animationType as string) || 'none'}
              onValueChange={(value) => handleChange('animationType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.none', 'None')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none', 'None')}</SelectItem>
                <SelectItem value="fade">{t('properties.animations.fade', 'Fade In')}</SelectItem>
                <SelectItem value="slide-up">{t('properties.animations.slideUp', 'Slide Up')}</SelectItem>
                <SelectItem value="slide-down">{t('properties.animations.slideDown', 'Slide Down')}</SelectItem>
                <SelectItem value="slide-left">{t('properties.animations.slideLeft', 'Slide Left')}</SelectItem>
                <SelectItem value="slide-right">{t('properties.animations.slideRight', 'Slide Right')}</SelectItem>
                <SelectItem value="zoom">{t('properties.animations.zoom', 'Zoom In')}</SelectItem>
                <SelectItem value="bounce">{t('properties.animations.bounce', 'Bounce')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(props.animationType && props.animationType !== 'none') && (
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">{t('properties.duration', 'Duration')}</Label>
                <span className="text-xs text-gray-500">{(props.animationDuration as number) || 1}s</span>
              </div>
              <Slider
                value={[(props.animationDuration as number) || 1]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={([val]) => handleChange('animationDuration', val)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContentFields = () => {
    switch (type) {
      case 'header':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.companyName', 'Company Name')}</Label>
              <Input
                value={(props.companyName as string) || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.logoUrl', 'Logo URL')}</Label>
              <div className="mt-1.5">
                <ImageUpload
                  value={props.logoUrl as string}
                  onChange={(url) => handleChange('logoUrl', url)}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>{t('properties.links', 'Navigation Links')}</Label>
              {(props.links as FooterLink[])?.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={link.label}
                    onChange={(e) => handleNestedChange('links', index, 'label', e.target.value)}
                    placeholder={t('properties.label', 'Label')}
                    className="flex-1"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => handleNestedChange('links', index, 'url', e.target.value)}
                    placeholder={t('properties.url', 'URL')}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveItem('links', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleAddItem('links', { label: t('properties.newLink', 'New Link'), url: '#' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.addLink', 'Add Link')}
              </Button>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label>{t('properties.showThemeToggle', 'Show Theme Toggle')}</Label>
                <Switch
                  checked={(props.showThemeToggle as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showThemeToggle', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showLanguageToggle', 'Show Language Toggle')}</Label>
                <Switch
                  checked={(props.showLanguageToggle as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showLanguageToggle', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">{t('properties.titleSize', 'Title Size')}</Label>
                <span className="text-xs text-gray-500">{(props.titleSize as number) || 48}px</span>
              </div>
              <Slider
                value={[(props.titleSize as number) || 48]}
                min={24}
                max={96}
                step={2}
                onValueChange={([val]) => handleChange('titleSize', val)}
              />
            </div>

            <div>
              <Label>{t('properties.subtitle', 'Subtitle')}</Label>
              <Textarea
                value={(props.subtitle as string) || ''}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">{t('properties.subtitleSize', 'Subtitle Size')}</Label>
                <span className="text-xs text-gray-500">{(props.subtitleSize as number) || 20}px</span>
              </div>
              <Slider
                value={[(props.subtitleSize as number) || 20]}
                min={14}
                max={48}
                step={1}
                onValueChange={([val]) => handleChange('subtitleSize', val)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('properties.buttonText', 'Button Text')}</Label>
                <Input
                  value={(props.buttonText as string) || ''}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('properties.buttonLink', 'Button Link')}</Label>
                <Input
                  value={(props.buttonLink as string) || ''}
                  onChange={(e) => handleChange('buttonLink', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{t('properties.buttonStyle', 'Button Style')}</Label>
              <Select
                value={(props.buttonStyle as string) || 'primary'}
                onValueChange={(value) => handleChange('buttonStyle', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">{t('properties.styles.primary', 'Primary')}</SelectItem>
                  <SelectItem value="secondary">{t('properties.styles.secondary', 'Secondary')}</SelectItem>
                  <SelectItem value="outline">{t('properties.styles.outline', 'Outline')}</SelectItem>
                  <SelectItem value="ghost">{t('properties.styles.ghost', 'Ghost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-xs">{t('properties.overlayOpacity', 'Overlay Opacity')}</Label>
                <span className="text-xs text-gray-500">{((props.overlayOpacity as number) || 0.3) * 100}%</span>
              </div>
              <Slider
                value={[(props.overlayOpacity as number) || 0.3]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([val]) => handleChange('overlayOpacity', val)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{t('properties.minHeight', 'Minimum Height')}</Label>
              <Select
                value={(props.minHeight as string) || '400px'}
                onValueChange={(value) => handleChange('minHeight', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300px">300px</SelectItem>
                  <SelectItem value="400px">400px</SelectItem>
                  <SelectItem value="500px">500px</SelectItem>
                  <SelectItem value="600px">600px</SelectItem>
                  <SelectItem value="100vh">{t('properties.fullScreen', 'Full Screen')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.sectionTitle', 'Section Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            
            <div className="space-y-3">
              <Label>{t('properties.features', 'Features')}</Label>
              {(props.items as FeatureItem[])?.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3 relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveItem('items', index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  
                  <div className="flex gap-3">
                    <div className="w-12">
                      <Label className="text-xs mb-1 block">{t('properties.icon', 'Icon')}</Label>
                      <Input
                        value={item.icon || ''}
                        onChange={(e) => handleNestedChange('items', index, 'icon', e.target.value)}
                        className="text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">{t('properties.title', 'Title')}</Label>
                      <Input
                        value={item.title || ''}
                        onChange={(e) => handleNestedChange('items', index, 'title', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">{t('properties.description', 'Description')}</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => handleNestedChange('items', index, 'description', e.target.value)}
                      className="h-16 text-xs"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleAddItem('items', { icon: '⭐', title: t('properties.newFeature', 'New Feature'), description: t('properties.featureDesc', 'Feature description') })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.addFeature', 'Add Feature')}
              </Button>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.content', 'Content')}</Label>
              <Textarea
                rows={12}
                value={(props.content as string) || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                className="mt-1.5 font-mono text-sm"
                placeholder="Enter your text content here..."
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.image', 'Image')}</Label>
              <div className="mt-1.5">
                <ImageUpload
                  value={props.imageUrl as string}
                  onChange={(url) => handleChange('imageUrl', url)}
                />
              </div>
            </div>
            <div>
              <Label>{t('properties.altText', 'Alt Text')}</Label>
              <Input
                value={(props.altText as string) || ''}
                onChange={(e) => handleChange('altText', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>{t('properties.category', 'Category')}</Label>
              <Select
                value={(props.categoryId as string) || 'all'}
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t('properties.allCategories', 'All Categories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('properties.allCategories', 'All Categories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('properties.numberOfProducts', 'Limit')}</Label>
                <Input
                  type="number"
                  value={(props.limit as number) || 8}
                  onChange={(e) => handleChange('limit', parseInt(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('properties.layout', 'Layout')}</Label>
                <Select
                  value={(props.layout as string) || 'grid'}
                  onValueChange={(value) => handleChange('layout', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">{t('properties.layouts.grid', 'Grid')}</SelectItem>
                    <SelectItem value="carousel">{t('properties.layouts.carousel', 'Carousel')}</SelectItem>
                    <SelectItem value="list">{t('properties.layouts.list', 'List')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {props.layout === 'grid' && (
              <div>
                <Label>{t('properties.columns', 'Columns')}</Label>
                <Select
                  value={(props.columns as string) || '4'}
                  onValueChange={(value) => handleChange('columns', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium text-sm">{t('properties.displayOptions', 'Display Options')}</h4>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showPrice', 'Show Price')}</Label>
                <Switch
                  checked={(props.showPrice as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showPrice', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showAddToCart', 'Show Add to Cart')}</Label>
                <Switch
                  checked={(props.showAddToCart as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showAddToCart', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showName', 'Show Name')}</Label>
                <Switch
                  checked={(props.showName as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showName', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showDescription', 'Show Description')}</Label>
                <Switch
                  checked={(props.showDescription as boolean) || false}
                  onCheckedChange={(checked) => handleChange('showDescription', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showImage', 'Show Image')}</Label>
                <Switch
                  checked={(props.showImage as boolean) !== false}
                  onCheckedChange={(checked) => handleChange('showImage', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showRating', 'Show Rating')}</Label>
                <Switch
                  checked={(props.showRating as boolean) || false}
                  onCheckedChange={(checked) => handleChange('showRating', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showStock', 'Show Stock Status')}</Label>
                <Switch
                  checked={(props.showStock as boolean) || false}
                  onCheckedChange={(checked) => handleChange('showStock', checked)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-medium text-sm">{t('properties.sortingOptions', 'Sorting & Filtering')}</h4>
              <div>
                <Label>{t('properties.sortBy', 'Sort By')}</Label>
                <Select
                  value={(props.sortBy as string) || 'default'}
                  onValueChange={(value) => handleChange('sortBy', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t('properties.sort.default', 'Default')}</SelectItem>
                    <SelectItem value="price-asc">{t('properties.sort.priceAsc', 'Price: Low to High')}</SelectItem>
                    <SelectItem value="price-desc">{t('properties.sort.priceDesc', 'Price: High to Low')}</SelectItem>
                    <SelectItem value="name-asc">{t('properties.sort.nameAsc', 'Name: A-Z')}</SelectItem>
                    <SelectItem value="name-desc">{t('properties.sort.nameDesc', 'Name: Z-A')}</SelectItem>
                    <SelectItem value="newest">{t('properties.sort.newest', 'Newest First')}</SelectItem>
                    <SelectItem value="oldest">{t('properties.sort.oldest', 'Oldest First')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showOnlyAvailable', 'Show Only Available')}</Label>
                <Switch
                  checked={(props.showOnlyAvailable as boolean) || false}
                  onCheckedChange={(checked) => handleChange('showOnlyAvailable', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('properties.showOnlyFeatured', 'Show Only Featured')}</Label>
                <Switch
                  checked={(props.showOnlyFeatured as boolean) || false}
                  onCheckedChange={(checked) => handleChange('showOnlyFeatured', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.images', 'Images')}</Label>
              <div className="mt-1.5">
                <MultiImageUpload
                  value={(props.images as string[]) || []}
                  onChange={(urls) => handleChange('images', urls)}
                />
              </div>
            </div>
            <div>
              <Label>{t('properties.columns', 'Columns')}</Label>
              <Select
                value={(props.columns as string) || '3'}
                onValueChange={(value) => handleChange('columns', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">{t('properties.columnOptions.2', '2 Columns')}</SelectItem>
                  <SelectItem value="3">{t('properties.columnOptions.3', '3 Columns')}</SelectItem>
                  <SelectItem value="4">{t('properties.columnOptions.4', '4 Columns')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.description', 'Description')}</Label>
              <Textarea
                value={(props.description as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.images', 'Images')}</Label>
              <div className="mt-1.5">
                <MultiImageUpload
                  value={(props.images as string[]) || []}
                  onChange={(urls) => handleChange('images', urls)}
                />
              </div>
            </div>
            <div>
              <Label>{t('properties.height', 'Height')}</Label>
              <Input
                value={(props.height as string) || '500px'}
                onChange={(e) => handleChange('height', e.target.value)}
                className="mt-1.5"
                placeholder="500px"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(props.autoPlay as boolean) !== false}
                    onChange={(e) => handleChange('autoPlay', e.target.checked)}
                    className="rounded"
                  />
                  {t('properties.autoPlay', 'Auto Play')}
                </Label>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(props.showDots as boolean) !== false}
                    onChange={(e) => handleChange('showDots', e.target.checked)}
                    className="rounded"
                  />
                  {t('properties.showDots', 'Show Dots')}
                </Label>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(props.showArrows as boolean) !== false}
                    onChange={(e) => handleChange('showArrows', e.target.checked)}
                    className="rounded"
                  />
                  {t('properties.showArrows', 'Show Arrows')}
                </Label>
              </div>
            </div>
            <div>
              <Label>{t('properties.interval', 'Interval (ms)')}</Label>
              <Input
                type="number"
                value={(props.interval as number) || 5000}
                onChange={(e) => handleChange('interval', parseInt(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.animationType', 'Animation Type')}</Label>
              <Select
                value={(props.animationType as string) || 'slide'}
                onValueChange={(value) => handleChange('animationType', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">{t('properties.animations.slide', 'Slide')}</SelectItem>
                  <SelectItem value="fade">{t('properties.animations.fade', 'Fade')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Items Management */}
            <div className="space-y-3">
              <Label>{t('properties.items', 'Content Items')}</Label>
              {((props.items as ContentSliderItem[]) || []).map((item: ContentSliderItem, index: number) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-3 relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveItem('items', index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>

                  <div className="flex gap-3">
                    <div className="w-16">
                      <Label className="text-xs mb-1 block">{t('properties.icon', 'Icon')}</Label>
                      <Input
                        value={item.icon || ''}
                        onChange={(e) => handleNestedChange('items', index, 'icon', e.target.value)}
                        className="text-center text-2xl"
                        placeholder="🎯"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">{t('properties.title', 'Title')}</Label>
                      <Input
                        value={item.title || ''}
                        onChange={(e) => handleNestedChange('items', index, 'title', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">{t('properties.description', 'Description')}</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => handleNestedChange('items', index, 'description', e.target.value)}
                      className="h-16 text-xs"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleAddItem('items', { 
                  id: `item-${Date.now()}`, 
                  icon: '⭐', 
                  title: t('properties.newItem', 'New Item'), 
                  description: t('properties.itemDesc', 'Item description') 
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.addItem', 'Add Item')}
              </Button>
            </div>

            {/* Direction */}
            <div>
              <Label>{t('properties.direction', 'Direction')}</Label>
              <Select
                value={(props.direction as string) || 'horizontal'}
                onValueChange={(value) => handleChange('direction', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">{t('properties.horizontal', 'Horizontal')}</SelectItem>
                  <SelectItem value="vertical">{t('properties.vertical', 'Vertical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Speed */}
            <div>
              <Label>{t('properties.speed', 'Speed (seconds)')}</Label>
              <Input
                type="number"
                value={(props.speed as number) || 20}
                onChange={(e) => handleChange('speed', parseInt(e.target.value))}
                className="mt-1.5"
                min="5"
                max="60"
              />
            </div>

            {/* Item Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('properties.itemWidth', 'Item Width')}</Label>
                <Input
                  value={(props.itemWidth as string) || '300px'}
                  onChange={(e) => handleChange('itemWidth', e.target.value)}
                  className="mt-1.5"
                  placeholder="300px"
                />
              </div>
              <div>
                <Label>{t('properties.gap', 'Gap')}</Label>
                <Input
                  value={(props.gap as string) || '2rem'}
                  onChange={(e) => handleChange('gap', e.target.value)}
                  className="mt-1.5"
                  placeholder="2rem"
                />
              </div>
            </div>

            {/* Pause on Hover */}
            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(props.pauseOnHover as boolean) !== false}
                  onChange={(e) => handleChange('pauseOnHover', e.target.checked)}
                  className="rounded"
                />
                {t('properties.pauseOnHover', 'Pause on Hover')}
              </Label>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('properties.description', 'Description')}</Label>
              <Textarea
                value={(props.description as string) || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('properties.buttonText', 'Button Text')}</Label>
                <Input
                  value={(props.buttonText as string) || ''}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>{t('properties.buttonLink', 'Button Link')}</Label>
                <Input
                  value={(props.buttonLink as string) || ''}
                  onChange={(e) => handleChange('buttonLink', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.companyName', 'Company Name')}</Label>
              <Input
                value={(props.companyName as string) || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="mt-1.5"
              />
            </div>
            
            <div className="space-y-3">
              <Label>{t('properties.links', 'Links')}</Label>
              {(props.links as FooterLink[])?.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={link.label}
                    onChange={(e) => handleNestedChange('links', index, 'label', e.target.value)}
                    placeholder={t('properties.label', 'Label')}
                    className="flex-1"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => handleNestedChange('links', index, 'url', e.target.value)}
                    placeholder={t('properties.url', 'URL')}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveItem('links', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleAddItem('links', { label: t('properties.newLink', 'New Link'), url: '#' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.addLink', 'Add Link')}
              </Button>
            </div>
          </div>
        );

      case 'merchant-dashboard':
      case 'product-list':
      case 'store-page':
      case 'support-tickets':
      case 'favorites-page':
      case 'balance-operations':
      case 'employees-page':
      case 'charge-wallet':
      case 'reports-page':
      case 'profile-page':
      case 'categories-hierarchy':
      case 'testimonials':
      case 'pricing':
      case 'team':
      case 'stats':
      case 'faq':
      case 'newsletter':
      case 'video':
      case 'countdown':
      case 'brands':
      case 'contact':
      case 'payments':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('properties.title', 'Title')}</Label>
              <Input
                value={(props.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1.5"
                placeholder={t('properties.titlePlaceholder', 'Enter section title')}
              />
            </div>
            <div>
              <Label>{t('properties.subtitle', 'Subtitle')}</Label>
              <Input
                value={(props.subtitle as string) || ''}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="mt-1.5"
                placeholder={t('properties.subtitlePlaceholder', 'Enter section subtitle')}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>{t('properties.showTitle', 'Show Title')}</Label>
              <Switch
                checked={(props.showTitle as boolean) !== false}
                onCheckedChange={(checked) => handleChange('showTitle', checked)}
              />
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500 text-sm">{t('properties.noProperties', 'No properties available.')}</p>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('properties.editSection', 'Edit Section')}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleOpenCodeEditor} className="h-8 w-8 p-0" title={t('properties.editCode', 'Edit Code')}>
            <Code className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="content" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="content">{t('properties.content', 'Content')}</TabsTrigger>
              <TabsTrigger value="style">{t('properties.style', 'Style')}</TabsTrigger>
              <TabsTrigger value="settings">{t('properties.settings', 'Settings')}</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="content" className="m-0 space-y-6">
              {renderContentFields()}
            </TabsContent>
            
            <TabsContent value="style" className="m-0">
              {renderStyleFields()}
              {/* Image Frame & Effects (for image sections) */}
              {(type === 'image' || type === 'gallery' || type === 'hero') && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-500 flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    {t('properties.imageEffects', 'Image Effects')}
                  </h4>
                  
                  {/* Image Frame Style */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.frameStyle', 'Frame Style')}</Label>
                    <Select
                      value={(props.frameStyle as string) || 'none'}
                      onValueChange={(value) => handleChange('frameStyle', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="rounded">Rounded Corners</SelectItem>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="polaroid">Polaroid</SelectItem>
                        <SelectItem value="shadow">Shadow Frame</SelectItem>
                        <SelectItem value="border">Border Frame</SelectItem>
                        <SelectItem value="double">Double Border</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Border Width */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <Label className="text-xs">{t('properties.borderWidth', 'Border Width')}</Label>
                      <span className="text-xs text-gray-500">{(props.borderWidth as number) || 0}px</span>
                    </div>
                    <Slider
                      value={[(props.borderWidth as number) || 0]}
                      min={0}
                      max={20}
                      step={1}
                      onValueChange={([val]) => handleChange('borderWidth', val)}
                    />
                  </div>
                  
                  {/* Border Color */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.borderColor', 'Border Color')}</Label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full border overflow-hidden shrink-0">
                        <input
                          type="color"
                          value={props.borderColor as string || '#000000'}
                          onChange={(e) => handleChange('borderColor', e.target.value)}
                          className="w-full h-full cursor-pointer"
                        />
                      </div>
                      <Input
                        value={props.borderColor as string || '#000000'}
                        onChange={(e) => handleChange('borderColor', e.target.value)}
                        className="flex-1 h-8 text-xs"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  {/* Image Shadow */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.imageShadow', 'Shadow')}</Label>
                    <Select
                      value={(props.imageShadow as string) || 'none'}
                      onValueChange={(value) => handleChange('imageShadow', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                        <SelectItem value="2xl">2X Large</SelectItem>
                        <SelectItem value="inner">Inner Shadow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image Filter */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.imageFilter', 'Filter')}</Label>
                    <Select
                      value={(props.imageFilter as string) || 'none'}
                      onValueChange={(value) => handleChange('imageFilter', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="grayscale">Grayscale</SelectItem>
                        <SelectItem value="sepia">Sepia</SelectItem>
                        <SelectItem value="blur">Blur</SelectItem>
                        <SelectItem value="brightness">Bright</SelectItem>
                        <SelectItem value="contrast">High Contrast</SelectItem>
                        <SelectItem value="saturate">Saturated</SelectItem>
                        <SelectItem value="hue">Hue Rotate</SelectItem>
                        <SelectItem value="invert">Invert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image Display Animation */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.imageAnimation', 'Display Animation')}</Label>
                    <Select
                      value={(props.imageAnimation as string) || 'none'}
                      onValueChange={(value) => handleChange('imageAnimation', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fade">Fade In</SelectItem>
                        <SelectItem value="slide-up">Slide Up</SelectItem>
                        <SelectItem value="slide-down">Slide Down</SelectItem>
                        <SelectItem value="slide-left">Slide Left</SelectItem>
                        <SelectItem value="slide-right">Slide Right</SelectItem>
                        <SelectItem value="zoom">Zoom In</SelectItem>
                        <SelectItem value="zoom-out">Zoom Out</SelectItem>
                        <SelectItem value="rotate">Rotate In</SelectItem>
                        <SelectItem value="flip">Flip</SelectItem>
                        <SelectItem value="parallax">Parallax Scroll</SelectItem>
                        <SelectItem value="ken-burns">Ken Burns Effect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Hover Effect */}
                  <div>
                    <Label className="text-xs mb-1.5 block">{t('properties.hoverEffect', 'Hover Effect')}</Label>
                    <Select
                      value={(props.hoverEffect as string) || 'none'}
                      onValueChange={(value) => handleChange('hoverEffect', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="scale">Scale Up</SelectItem>
                        <SelectItem value="scale-down">Scale Down</SelectItem>
                        <SelectItem value="rotate">Rotate</SelectItem>
                        <SelectItem value="brightness">Brighten</SelectItem>
                        <SelectItem value="grayscale">Remove Grayscale</SelectItem>
                        <SelectItem value="blur">Remove Blur</SelectItem>
                        <SelectItem value="lift">Lift (Shadow)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="m-0">
              {renderSettingsFields()}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Code Editor Dialog */}
      <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
        <DialogContent className="max-w-4xl h-[80vh] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
              <Code className="w-5 h-5" />
              {t('properties.editSectionCode', 'Edit Section Code')}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('properties.editCodeDesc', 'Edit the section properties directly in JSON format.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border dark:border-gray-700 rounded-lg overflow-hidden mt-4 relative" style={{ backgroundColor: '#1e1e1e', height: 'calc(80vh - 250px)', minHeight: '400px' }}>
            <div style={{ color: '#d4d4d4', height: '100%', width: '100%' }}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={codeEditorValue}
                onChange={(value) => setCodeEditorValue(value || '')}
                theme="vs-dark"
                onMount={(editor) => {
                  setEditorMounted(true);
                  // Force layout refresh after dialog animation
                  setTimeout(() => {
                    editor.layout();
                  }, 100);
                  // Additional layout refresh after a short delay to ensure dialog is fully rendered
                  setTimeout(() => {
                    editor.layout();
                  }, 300);
                }}
                loading={<div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-300"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Editor...</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: 'on',
                  readOnly: false,
                  cursorStyle: 'line',
                  renderLineHighlight: 'all',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCodeEditor(false)} className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleApplyCodeChanges} className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700">
              <Code className="w-4 h-4" />
              {t('common.apply', 'Apply Changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
