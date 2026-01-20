import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Cloud, Trash2 } from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { uploadService } from '@/services/upload.service';
import { useToast } from '@/hooks/use-toast';
import { validateImageSignature } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive?: boolean;
}

interface CategoryFormProps {
  categories: Category[];
  initialData?: Category | null;
  parentId?: string | null;
  onSave: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export interface CategoryFormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  slug: string;
  parentId: string;
  image: string;
  icon: string;
  isActive: boolean;
}

export function CategoryForm({
  categories,
  initialData,
  parentId,
  onSave,
  onCancel,
  saving = false,
}: CategoryFormProps) {
  const { toast } = useToast();
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    nameAr: initialData?.nameAr || '',
    description: initialData?.description || '',
    descriptionAr: initialData?.descriptionAr || '',
    slug: initialData?.slug || '',
    parentId: initialData?.parentId || parentId || '',
    image: initialData?.image || '',
    icon: initialData?.icon || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        nameAr: initialData.nameAr || '',
        description: initialData.description || '',
        descriptionAr: initialData.descriptionAr || '',
        slug: initialData.slug || '',
        parentId: initialData.parentId || parentId || '',
        image: initialData.image || '',
        icon: initialData.icon || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else if (parentId) {
      setFormData(prev => ({ ...prev, parentId }));
    }
  }, [initialData, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    await onSave(formData);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Check
    const { isValid, reason } = await validateImageSignature(file);
    if (!isValid) {
      toast({
        title: 'ملف غير آمن',
        description: reason || 'تم رفض الملف لأسباب أمنية',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadService.uploadImage(file);
      setFormData(prev => ({ ...prev, image: response.secureUrl || response.url }));
      toast({ title: 'تم الرفع بنجاح', description: 'تم رفع الصورة بنجاح' });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'تعذر رفع الصورة',
        description: 'حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloudinarySelect = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, image: urls[0] }));
    }
    setShowCloudinaryPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-1">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="grid gap-2">
            <Label>الاسم *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="اسم الفئة"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>الاسم (عربي)</Label>
            <Input
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="اسم الفئة بالعربية"
            />
          </div>
          <div className="grid gap-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف الفئة"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>الوصف (عربي)</Label>
            <Textarea
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder="وصف الفئة بالعربية"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>الرابط (Slug)</Label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="سيتم إنشاؤه تلقائياً إذا تركت فارغاً"
            />
          </div>
          <div className="grid gap-2">
            <Label>الفئة الأب</Label>
            <Select
              value={formData.parentId || "none"}
              onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة أب (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">لا يوجد (فئة رئيسية)</SelectItem>
                {categories
                  .filter(cat => {
                    // Don't show the current category being edited
                    if (initialData && cat.id === initialData.id) return false;
                    // Don't show categories that would create a circular reference
                    if (initialData) {
                      let currentParent = cat.parentId;
                      while (currentParent) {
                        if (currentParent === initialData.id) return false;
                        const parentCat = categories.find(c => c.id === currentParent);
                        currentParent = parentCat?.parentId;
                      }
                    }
                    return true;
                  })
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr || cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>الصورة</Label>
            <div className="space-y-4">
              {formData.image && (
                <div className="relative group w-full max-w-[200px] aspect-square mx-auto">
                  <img
                    src={formData.image}
                    alt="Category Preview"
                    className="w-full h-full object-cover rounded-md border shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    رفع صورة
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setShowCloudinaryPicker(true)}
                  >
                    <Cloud className="h-4 w-4" />
                    المكتبة
                  </Button>
                </div>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="أو أدخل رابط الصورة يدوياً"
                  className="text-xs"
                />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="grid gap-2">
            <Label>الأيقونة</Label>
            <Input
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="اسم الأيقونة أو رابط الأيقونة"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="cursor-pointer">نشط</Label>
          </div>
        </form>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-2 bg-background sticky bottom-0 z-10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          form="category-form"
          disabled={saving || !formData.name.trim()}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري الحفظ...
            </>
          ) : (
            initialData ? 'تحديث' : 'إضافة'
          )}
        </Button>
      </div>

      <CloudinaryImagePicker
        open={showCloudinaryPicker}
        onOpenChange={setShowCloudinaryPicker}
        onSelect={handleCloudinarySelect}
        multiple={false}
      />
    </div>
  );
}

