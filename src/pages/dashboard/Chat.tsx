import React, { useEffect, useState, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    name?: string;
    email: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const { user } = useAuth();

  const loadMessages = useCallback(async () => {
    try {
      const res = await coreApi.get('/chat');
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const send = async () => {
    if (!newMsg.trim()) return;
    try {
      await coreApi.post('/chat', { content: newMsg });
      setNewMsg('');
      // Reload messages immediately after sending
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse">
        {messages.map(m => (
          <div key={m.id} className={`rounded p-2 max-w-[70%] ${m.senderId === user?.id ? 'bg-blue-100 self-start' : 'bg-gray-100 self-end'}`}>
            <div className="font-bold text-xs mb-1">{m.sender?.name || m.sender?.email || m.senderId}</div>
            <div>{m.content}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <div className="flex p-4 border-t gap-2">
        <Input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="اكتب رسالة…"
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <Button onClick={send}>
          إرسال
        </Button>
      </div>
    </div>
  );
}
