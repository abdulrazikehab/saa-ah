import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ui/image-upload';
import { Cloud, ImageIcon, X, Save } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { useTranslation } from 'react-i18next';

interface BrandFormData {
  name: string;
  nameAr: string;
  code: string;
  logo: string;
}

interface BrandFormProps {
  initialData?: {
    id: string;
    name: string;
    nameAr?: string;
    code?: string;
    logo?: string;
  } | null;
  onSave: (data: BrandFormData) => Promise<void>;
  onCancel?: () => void;
  hasCloudinaryAccess: boolean;
  isSaving?: boolean;
}

export function BrandForm({ 
  initialData, 
  onSave, 
  onCancel, 
  hasCloudinaryAccess,
  isSaving = false 
}: BrandFormProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    nameAr: '',
    code: '',
    logo: '',
  });

  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        nameAr: initialData.nameAr || '',
        code: initialData.code || '',
        logo: initialData.logo || '',
      });
    } else {
      setFormData({
        name: '',
        nameAr: '',
        code: '',
        logo: '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? t('common.edit') : t('common.create')} {t('dashboard.products.brand')}
          </h2>
          <p className="text-muted-foreground mt-1">
            {initialData 
              ? 'تعديل بيانات العلامة التجارية الموجودة'
              : 'إضافة علامة تجارية جديدة إلى النظام'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSaving || !formData.name.trim()}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Brand Logo Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              شعار العلامة التجارية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
              {/* Current Logo Preview */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center group">
                  {formData.logo ? (
                    <>
                      <img 
                        src={formData.logo} 
                        alt="Brand Logo" 
                        className="w-full h-full object-contain p-2" 
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">لا يوجد شعار</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Options */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رفع صورة</Label>
                    <ImageUpload
                      value=""
                      onChange={(url) => setFormData({ ...formData, logo: url })}
                      placeholder="رفع من الجهاز"
                      className="h-24"
                    />
                  </div>
                  
                  {hasCloudinaryAccess && (
                    <div className="space-y-2">
                      <Label>مكتبة الصور</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 w-full flex flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                        onClick={() => setShowImagePicker(true)}
                      >
                        <Cloud className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm">اختر من Cloudinary</span>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  يوصى باستخدام صورة بخلفية شفافة (PNG) وبأبعاد مربعة (مثلاً 500x500 بكسل).
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">
                  اسم العلامة التجارية (English) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brandName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Brand Name"
                  className="h-11"
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="brandNameAr">
                  اسم العلامة التجارية (العربية)
                </Label>
                <Input
                  id="brandNameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="اسم العلامة التجارية"
                  dir="rtl"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandCode">
                  رمز العلامة التجارية
                </Label>
                <Input
                  id="brandCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BRAND-001"
                  className="h-11 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  رمز فريد للعلامة التجارية لاستخدامه في الباركود أو التعريف
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CloudinaryImagePicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        multiple={false}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setFormData(prev => ({ ...prev, logo: urls[0] }));
          }
          setShowImagePicker(false);
        }}
      />
    </div>
  );
}
