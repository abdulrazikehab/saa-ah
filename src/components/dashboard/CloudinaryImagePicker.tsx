import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Image as ImageIcon, X, Folder, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { mediaService, type CloudinaryImage } from '@/services/media.service';
import { useToast } from '@/hooks/use-toast';

interface CloudinaryImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (images: string[]) => void;
  multiple?: boolean;
}

export function CloudinaryImagePicker({
  open,
  onOpenChange,
  onSelect,
  multiple = true,
}: CloudinaryImagePickerProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use refs for loading guards and state tracking to avoid dependency loops
  const isLoadingFoldersRef = useRef(false);
  const isLoadingImagesRef = useRef(false);
  const prevOpenRef = useRef(false);
  const lastLoadedFolderRef = useRef<string>('');

  const loadFolders = useCallback(async () => {
    if (isLoadingFoldersRef.current) return;
    
    isLoadingFoldersRef.current = true;
    setLoadingFolders(true);
    
    try {
      const result = await mediaService.listFolders();
      setFolders(result.folders || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل المجلدات';
      console.error('❌ Failed to load folders:', error);
      toast({
        title: 'تعذر تحميل المجلدات',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingFolders(false);
      isLoadingFoldersRef.current = false;
    }
  }, [toast]);

  const loadImages = useCallback(async (folder: string, cursor?: string) => {
    if (isLoadingImagesRef.current && !cursor) return;
    
    isLoadingImagesRef.current = true;
    setLoading(true);
    
    try {
      const result = await mediaService.getImagesFromFolder(folder, {
        limit: 50,
        nextCursor: cursor,
        sort: 'desc',
      });

      if (cursor) {
        setImages((prev) => [...prev, ...result.data]);
      } else {
        setImages(result.data);
      }

      setNextCursor(result.next_cursor);
      setHasMore(!!result.next_cursor);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل الصور';
      console.error('❌ Failed to load images:', error);
      toast({
        title: 'تعذر تحميل الصور',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      isLoadingImagesRef.current = false;
    }
  }, [toast]);

  // Initialize/Reset when dialog opens
  useEffect(() => {
    // Only run initialization when open changes from false to true
    if (open && !prevOpenRef.current) {
      setSelectedFolder('');
      setImages([]);
      setSelectedImages(new Set());
      setSelectedCount(0);
      setNextCursor(undefined);
      setSearchQuery('');
      lastLoadedFolderRef.current = '';
      
      loadFolders();
    }
    prevOpenRef.current = open;
  }, [open, loadFolders]);

  // Auto-select first folder when folders are loaded
  useEffect(() => {
    if (open && folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0]);
    }
  }, [open, folders, selectedFolder]);

  // Load images when folder is selected
  useEffect(() => {
    if (open && selectedFolder && selectedFolder !== lastLoadedFolderRef.current) {
      lastLoadedFolderRef.current = selectedFolder;
      loadImages(selectedFolder);
    }
  }, [open, selectedFolder, loadImages]);

  const loadMore = () => {
    if (selectedFolder && nextCursor && !loading) {
      loadImages(selectedFolder, nextCursor);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        if (!multiple && newSet.size > 0) {
          // Single selection mode - replace previous selection
          newSet.clear();
        }
        newSet.add(imageUrl);
      }
      const newCount = newSet.size;
      setSelectedCount(newCount);
      console.log('🟢 [CloudinaryImagePicker] Selection changed:', Array.from(newSet), 'Count:', newCount);
      
      // In single selection mode, automatically select and close
      if (!multiple && newSet.size > 0) {
        const selectedUrls = Array.from(newSet);
        console.log('🟢 [CloudinaryImagePicker] Auto-selecting in single mode:', selectedUrls);
        // Use setTimeout to ensure state is updated before calling onSelect
        setTimeout(() => {
          onSelect(selectedUrls);
          setSelectedImages(new Set());
          setSelectedCount(0);
          onOpenChange(false);
        }, 100);
      }
      
      return newSet;
    });
  };

  const handleSelect = () => {
    try {
      console.log('🔵 [CloudinaryImagePicker] handleSelect called');
      const selectedUrls = Array.from(selectedImages);
      console.log('🔵 [CloudinaryImagePicker] Selected URLs:', selectedUrls);
      
      if (selectedUrls.length === 0) {
        console.warn('🔵 [CloudinaryImagePicker] No images selected');
        toast({
          title: 'لم يتم اختيار صور',
          description: 'يرجى اختيار صورة واحدة على الأقل',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('🔵 [CloudinaryImagePicker] Calling onSelect prop');
      onSelect(selectedUrls);
      console.log('🔵 [CloudinaryImagePicker] onSelect returned');
      
      setSelectedImages(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('🔴 [CloudinaryImagePicker] Error in handleSelect:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء اختيار الصور',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = searchQuery
    ? images.filter((img) =>
        img.public_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : images;


  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh]" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            اختر الصور من Cloudinary
          </DialogTitle>
          <DialogDescription>
            اختر الصور من مجلدات Cloudinary. يمكنك اختيار {multiple ? 'عدة صور' : 'صورة واحدة'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4" style={{ height: '600px', maxHeight: 'calc(90vh - 200px)' }}>
          {/* Folders Sidebar */}
          <div className="col-span-3 border-r pr-4 flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                المجلدات
              </h3>
              {loadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => {
                          setSelectedFolder(folder);
                          setImages([]);
                          setNextCursor(undefined);
                          setSelectedImages(new Set());
                          setSelectedCount(0);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                          selectedFolder === folder
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="truncate">{folder}</span>
                        {selectedFolder === folder && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Images Grid */}
          <div className="col-span-9 flex flex-col min-h-0">
            {/* Search */}
            <div className="mb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن صورة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Selected count */}
            {selectedCount > 0 && (
              <div className="mb-4 flex-shrink-0">
                <Badge variant="secondary">
                  {selectedCount} {multiple ? 'صور محددة' : 'صورة محددة'}
                </Badge>
              </div>
            )}

            {/* Images Grid */}
            <ScrollArea className="flex-1 min-h-0">
              {loading && images.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد صور في هذا المجلد</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 pb-4">
                  {filteredImages.map((image, index) => {
                    const isSelected = selectedImages.has(image.secure_url);
                    return (
                      <div
                        key={`${image.public_id}-${index}`}
                        className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all aspect-square ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleImageSelection(image.secure_url)}
                      >
                        <div className="relative w-full h-full bg-muted">
                          <img
                            src={image.secure_url}
                            alt={image.public_id}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Failed to load image:', image.secure_url);
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-sm">
                              <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                                <X className="h-5 w-5" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white text-xs p-2">
                            <p className="truncate font-medium">{image.public_id.split('/').pop()}</p>
                          </div>
                          {!isSelected && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-4 flex justify-center flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    'تحميل المزيد'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={selectedCount === 0}
            className={selectedCount > 0 ? '' : 'opacity-50 cursor-not-allowed'}
          >
            حفظ {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

