import HierarchicalManager from './HierarchicalManager';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function HierarchicalStandalone() {
  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      <DashboardHeader />
      <div className="flex-1 overflow-hidden p-2">
        <HierarchicalManager isFullScreen={true} />
      </div>
    </div>
  );
}
