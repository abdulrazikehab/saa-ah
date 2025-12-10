import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export default function PlaceholderPage({ 
  title, 
  description, 
  icon: Icon,
  actionLabel,
  onAction 
}: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-lg mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            هذه الصفحة قيد التطوير وسيتم إطلاقها قريباً.
          </p>
          {actionLabel && (
            <Button onClick={onAction} className="w-full">
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
