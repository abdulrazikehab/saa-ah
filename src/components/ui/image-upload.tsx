import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadService } from '@/services/upload.service';
import { useToast } from '@/hooks/use-toast';
import { cn, validateImageSignature } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
}

export function ImageUpload({ value, onChange, className, placeholder = "Upload image" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file type (MIME type check)
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'نوع الملف غير صالح',
        description: 'يرجى تحميل ملف صورة (JPEG, PNG, WEBP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'حجم الملف كبير جداً',
        description: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    // Security Check: Validate Image Signature (Magic Numbers)
    const { isValid, reason } = await validateImageSignature(file);
    if (!isValid) {
      toast({
        title: 'ملف غير آمن',
        description: reason || 'تم رفض الملف لأسباب أمنية',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadService.uploadImage(file);
      onChange(response.secureUrl || response.url);
      toast({
        title: 'تم بنجاح',
        description: 'تم رفع الصورة بنجاح',
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'فشل الرفع',
        description: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn("w-full", className)}>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 aspect-video">
          <img 
            src={value} 
            alt="Uploaded" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Change
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-video",
            isDragging 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-900"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="font-medium text-sm mb-1">{placeholder}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drag & drop or click to upload
              </p>
            </div>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
