import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageBuilder, Section } from '@/components/builder/PageBuilder';
import { coreApi } from '@/lib/api';
import { templateService } from '@/services/template.service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, RotateCcw, Clock, Code, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { AIChatHelper } from '@/components/chat/AIChatHelper';
import { PageHistory } from '@/services/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageBuilderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<PageHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [editorMounted, setEditorMounted] = useState(false);

  // Fetch domain information
  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const domainData = await coreApi.getDomain();
        if (domainData) {
          setDomain(domainData.customDomain || `${domainData.subdomain}.saa'ah.com`);
        }
      } catch (error) {
        console.error('Failed to fetch domain:', error);
      }
    };
    fetchDomain();

    // Initialize with default section for new pages
    if (!id) {
      setSections([
        {
          id: `section-${Date.now()}`,
          type: 'hero',
          props: {
            title: 'Welcome to Our Store',
            subtitle: 'Discover amazing products',
            buttonText: 'Shop Now',
            buttonLink: '/products',
            backgroundImage: '',
            textColor: '#ffffff',
            backgroundColor: '#000000',
          },
        },
      ]);
    }
  }, [id]);

  const loadPage = useCallback(async () => {
    if (!id) return;
    
    try {
      const page = await coreApi.getPage(id);
      setTitle(page.title);
      setSlug(page.slug);
      
      // Prefer draftContent if available
      const content = page.draftContent || page.content;
      setSections((content?.sections as Section[]) || []);
      setBackgroundColor((content?.backgroundColor as string) || '#ffffff');
      setIsDarkMode((content?.isDarkMode as boolean) || false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load page',
        variant: 'destructive',
      });
    }
  }, [id, toast]);

  // Update code editor when sections change
  useEffect(() => {
    if (showCodeEditor) {
      const pageData = {
        sections,
        backgroundColor,
        isDarkMode
      };
      setCodeEditorValue(JSON.stringify(pageData, null, 2));
    }
  }, [sections, backgroundColor, isDarkMode, showCodeEditor]);

  const handleCodeEditorChange = (value: string | undefined) => {
    if (value) {
      setCodeEditorValue(value);
    }
  };

  const applyCodeChanges = () => {
    try {
      const parsed = JSON.parse(codeEditorValue);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        setSections(parsed.sections);
        if (parsed.backgroundColor) setBackgroundColor(parsed.backgroundColor);
        if (typeof parsed.isDarkMode === 'boolean') setIsDarkMode(parsed.isDarkMode);
        toast({
          title: 'Success',
          description: 'Code changes applied successfully',
        });
        setShowCodeEditor(false);
      } else {
        throw new Error('Invalid structure: sections array is required');
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Invalid JSON: ${String(error)}`,
        variant: 'destructive',
      });
    }
  };

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await templateService.getTemplateById(templateId);
      // Type assertion for template content
      const templateContent = template.content as { sections?: Section[] };
      setSections(templateContent?.sections || []);
      setTemplateName(template.name);
      toast({
        title: 'Template Loaded',
        description: `Using "${template.name}" template`,
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    
    if (id) {
      loadPage();
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [id, searchParams, loadPage, loadTemplate]);

  const handleSaveDraft = async (updatedSections: Section[]) => {
    setLoading(true);
    try {
      const content = { 
        sections: updatedSections,
        backgroundColor,
        isDarkMode
      };

      const finalSlug = slug.trim() === '' || slug.trim() === '/' ? '' : slug.trim().replace(/^\/+/, '');

      if (id) {
        await coreApi.updatePage(id, {
          title,
          slug: finalSlug,
          draftContent: content
        });
        toast({ title: 'Draft Saved', description: 'Changes saved to draft' });
      } else {
        await coreApi.createPage({
          title,
          slug: finalSlug,
          content: content, // Initial content
          draftContent: content,
          isPublished: false,
        });
        toast({ title: 'Success', description: 'Page created successfully' });
        navigate('/dashboard/pages');
      }
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (updatedSections: Section[]) => {
    setLoading(true);
    try {
      const content = { 
        sections: updatedSections,
        backgroundColor,
        isDarkMode
      };

      const finalSlug = slug.trim() === '' || slug.trim() === '/' ? '' : slug.trim().replace(/^\/+/, '');

      if (id) {
        await coreApi.updatePage(id, {
          title,
          slug: finalSlug,
          content: content,
          draftContent: content,
          isPublished: true
        });
        toast({ title: 'Published', description: 'Page published successfully' });
      } else {
        await coreApi.createPage({
          title,
          slug: finalSlug,
          content: content,
          draftContent: content,
          isPublished: true,
        });
        toast({ title: 'Published', description: 'Page created and published' });
        navigate('/dashboard/pages');
      }
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      const data = await coreApi.getHistory(id);
      setHistory(data);
      setShowHistory(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' });
    }
  };

  const handleRestore = async (historyId: string) => {
    if (!id) return;
    try {
      await coreApi.restoreVersion(id, historyId);
      toast({ title: 'Restored', description: 'Version restored to draft' });
      loadPage();
      setShowHistory(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore version', variant: 'destructive' });
    }
  };

  const handleError = (error: unknown) => {
    let errorMessage = 'Failed to save page';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('slug already exists') || errorMessage.includes('Conflict')) {
        errorMessage = `A page with the slug "${slug}" already exists. Please use a different URL slug.`;
      }
    }
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard/pages')}
            className="dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pages
          </Button>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            / {id ? 'Edit Page' : 'New Page'}
            {templateName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  Using "{templateName}" template
                </span>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Page Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About Us"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-700 dark:text-gray-300">URL Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="about-us"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <PageBuilder 
          initialSections={sections} 
          onSave={handleSaveDraft} 
          onPublish={handlePublish}
          onHistory={id ? loadHistory : undefined}
          onCodeEditor={() => {
            const pageData = {
              sections,
              backgroundColor,
              isDarkMode
            };
            setCodeEditorValue(JSON.stringify(pageData, null, 2));
            setShowCodeEditor(true);
            // Reset mounted state to trigger fresh load
            setEditorMounted(false);
          }}
          domain={domain}
          slug={slug}
          initialBackgroundColor={backgroundColor}
          initialDarkMode={isDarkMode}
          onBackgroundColorChange={setBackgroundColor}
          onDarkModeChange={setIsDarkMode}
        />
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Page History</DialogTitle>
            <DialogDescription>
              Restore a previous version of this page.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No history available</p>
              ) : (
                history.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Version {version.version}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(version.id)}
                    >
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Code Editor Dialog */}
      <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
        <DialogContent className="max-w-4xl h-[80vh] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
              <Code className="w-5 h-5" />
              Code Editor
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Edit the page structure directly in JSON format. Be careful - invalid JSON will not be applied.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border dark:border-gray-700 rounded-lg overflow-hidden mt-4 relative min-h-[400px]" style={{ backgroundColor: '#1e1e1e' }}>
            <div style={{ color: '#d4d4d4', height: '100%' }}>
              <Editor
                height="calc(80vh - 200px)"
                defaultLanguage="json"
                value={codeEditorValue}
                onChange={handleCodeEditorChange}
                theme="vs-dark"
                onMount={(editor) => {
                  setEditorMounted(true);
                  // Force layout refresh after dialog animation
                  setTimeout(() => {
                    editor.layout();
                  }, 100);
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
              Cancel
            </Button>
            <Button onClick={applyCodeChanges} className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700">
              <Code className="w-4 h-4" />
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chat Helper */}
      <AIChatHelper 
        context={{
          currentPage: title || 'New Page',
          userAction: id ? 'editing a page' : 'creating a new page'
        }}
      />
    </div>
  );
}
