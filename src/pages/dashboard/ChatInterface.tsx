import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Image, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    name?: string;
    email: string;
  };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unread: number;
  online: boolean;
  role?: string;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socketInstance = io(`${import.meta.env.VITE_CORE_BASE_URL || 'http://localhost:3002'}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to chat server');
    });

    socketInstance.on('message', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الاتصال',
        description: 'فشل الاتصال بخادم المحادثة',
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, toast]);

  // Load initial messages and users
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/chat', { requireAuth: true });
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحميل الرسائل',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    try {
      // The backend exposes a user list endpoint at /user/list
      const response = await coreApi.get('/user/list', { requireAuth: true });
      const usersList = (response?.data || []).map((u: { id: string; name?: string; email: string; avatar?: string; role: string }) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        avatar: u.avatar,
        online: false, // You can implement online status tracking later
        unread: 0,
        role: u.role,
      }));
      setContacts(usersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    loadUsers();
  }, [loadMessages, loadUsers]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !socket) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      // Send via Socket.IO for real-time delivery
      socket.emit('message', { content });

      // Also save to database via REST API
      await coreApi.post('/chat', { content }, { requireAuth: true });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إرسال الرسالة',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveContactInfo = () => {
    if (!activeContact) return null;
    return contacts.find((c) => c.id === activeContact);
  };

  const activeContactInfo = getActiveContactInfo();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Contacts List */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b space-y-4">
          <h2 className="font-semibold text-lg">المحادثات</h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              className="pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  activeContact === contact.id ? 'bg-muted/50' : ''
                }`}
                onClick={() => setActiveContact(contact.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium truncate block">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.role}</span>
                      </div>
                      {contact.time && (
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                    )}
                  </div>
                  {contact.unread > 0 && (
                    <Badge className="bg-primary hover:bg-primary">{contact.unread}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {activeContactInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={activeContactInfo.avatar} />
                  <AvatarFallback>{activeContactInfo.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{activeContactInfo.name}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {activeContactInfo.online && (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        متصل الآن
                      </>
                    )}
                    {!activeContactInfo.online && 'غير متصل'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="مكالمة صوتية">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="مكالمة فيديو">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="المزيد من الخيارات">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-3 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tl-none'
                              : 'bg-muted rounded-tr-none'
                          }`}
                        >
                          {!isMe && msg.sender && (
                            <p className="text-xs font-semibold mb-1">
                              {msg.sender.name || msg.sender.email}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <span
                            className={`text-xs mt-1 block ${
                              isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="إرفاق ملف">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="إرفاق صورة">
                  <Image className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="اكتب رسالتك..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" aria-label="تسجيل صوتي">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button size="icon" onClick={sendMessage} disabled={!messageInput.trim()} aria-label="إرسال الرسالة">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">اختر محادثة للبدء</p>
              <p className="text-sm">حدد جهة اتصال من القائمة لبدء المحادثة</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
