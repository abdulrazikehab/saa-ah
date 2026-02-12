import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { 
  MessageSquare, 
  Search, 
  Loader2, 
  Filter,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdminApiKey } from '@/lib/admin-config';

interface Complaint {
  id: string;
  tenantId?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  aiResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ComplaintsManager({ adminApiKey }: { adminApiKey?: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const loadComplaints = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await coreApi.get<{ items: Complaint[] }>('/admin/master/complaints', { 
        params,
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      setComplaints(response.items || []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load complaints'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, searchTerm, adminApiKey]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      if (!adminApiKey) return;
      setUpdating(true);
      await coreApi.put(`/admin/master/complaints/${id}`, { status }, { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      toast({
        title: 'Success',
        description: 'Status updated successfully'
      });
      loadComplaints();
      if (selectedComplaint?.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status: status as Complaint['status'] });
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (id: string, priority: string) => {
    try {
      if (!adminApiKey) return;
      setUpdating(true);
      await coreApi.put(`/admin/master/complaints/${id}`, { priority }, { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      toast({
        title: 'Success',
        description: 'Priority updated successfully'
      });
      loadComplaints();
      if (selectedComplaint?.id === id) {
        setSelectedComplaint({ ...selectedComplaint, priority: priority as Complaint['priority'] });
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update priority'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAiResponse = async () => {
    if (!selectedComplaint) return;
    try {
      if (!adminApiKey) return;
      setUpdating(true);
      await coreApi.put(`/admin/master/complaints/${selectedComplaint.id}`, { aiResponse }, { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      toast({
        title: 'Success',
        description: 'AI response saved'
      });
      loadComplaints();
      setSelectedComplaint({ ...selectedComplaint, aiResponse });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save AI response'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
      if (!adminApiKey) return;
      await coreApi.delete(`/admin/master/complaints/${id}`, { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      toast({
        title: 'Success',
        description: 'Complaint deleted'
      });
      loadComplaints();
      if (selectedComplaint?.id === id) setSelectedComplaint(null);
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete complaint'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-blue-400 bg-blue-400/10';
      case 'IN_PROGRESS': return 'text-yellow-400 bg-yellow-400/10';
      case 'WAITING_CUSTOMER': return 'text-purple-400 bg-purple-400/10';
      case 'RESOLVED': return 'text-green-400 bg-green-400/10';
      case 'CLOSED': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-gray-400';
      case 'MEDIUM': return 'text-blue-400';
      case 'HIGH': return 'text-orange-400';
      case 'URGENT': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Complaints List */}
      <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              {isRTL ? 'الشكاوى' : 'Complaints'}
            </h3>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">
              {complaints.length} {isRTL ? 'إجمالي' : 'Total'}
            </span>
          </div>
          
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
            <input
              type="text"
              placeholder={isRTL ? 'البحث في الشكاوى...' : 'Search complaints...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500`}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'ALL' ? (isRTL ? 'الكل' : 'ALL') : status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {isRTL ? 'لا توجد شكاوى' : 'No complaints found'}
            </div>
          ) : (
            complaints.map((complaint) => (
              <button
                key={complaint.id}
                onClick={() => {
                  setSelectedComplaint(complaint);
                  setAiResponse(complaint.aiResponse || '');
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedComplaint?.id === complaint.id
                    ? 'bg-purple-600/10 border-purple-500/50'
                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white line-clamp-1 mb-1">
                  {complaint.subject}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="line-clamp-1">{complaint.name}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Complaint Detail */}
      <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        {selectedComplaint ? (
          <>
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white">{selectedComplaint.subject}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {selectedComplaint.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {selectedComplaint.email}
                  </div>
                  {selectedComplaint.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {selectedComplaint.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(selectedComplaint.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                  title={isRTL ? 'حذف الشكوى' : 'Delete Complaint'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Message */}
              <section>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {isRTL ? 'محتوى الرسالة' : 'Message Content'}
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.message}
                </div>
              </section>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">{isRTL ? 'تحديث الحالة' : 'Update Status'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedComplaint.id, status)}
                        disabled={updating}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedComplaint.status === status
                            ? getStatusColor(status) + ' border border-current'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">{isRTL ? 'تحديد الأولوية' : 'Set Priority'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => handleUpdatePriority(selectedComplaint.id, priority)}
                        disabled={updating}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedComplaint.priority === priority
                            ? 'bg-slate-800 text-white border border-slate-600'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        } ${getPriorityColor(priority)}`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* AI Response */}
              <section>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  {isRTL ? 'رد الذكاء الاصطناعي / ملاحظات داخلية' : 'AI Response / Internal Notes'}
                </h4>
                <div className="space-y-3">
                  <textarea
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    placeholder={isRTL ? 'اكتب رد الذكاء الاصطناعي أو الملاحظات هنا...' : 'Type AI response or internal notes here...'}
                    className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAiResponse}
                      disabled={updating || aiResponse === selectedComplaint.aiResponse}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الرد' : 'Save Response')}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-full">
              <MessageSquare className="w-12 h-12 text-slate-700" />
            </div>
            <p>{isRTL ? 'اختر شكوى لعرض التفاصيل' : 'Select a complaint to view details'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
