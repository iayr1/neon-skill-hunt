import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Search, 
  MessageCircle, 
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  avatar_url: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: Profile;
}

interface Conversation {
  id: string;
  other_user: Profile;
  last_message: Message;
  unread_count: number;
}

const Messages = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchConversations();
          if (selectedConversation && payload.new.conversation_id === selectedConversation) {
            fetchMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    try {
      // Get all messages where user is sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and get the latest message for each
      const conversationMap = new Map();
      
      messagesData?.forEach((message) => {
        const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
        const conversationId = message.conversation_id;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            other_user_id: otherUserId,
            last_message: message,
            messages: [message],
          });
        } else {
          const existing = conversationMap.get(conversationId);
          existing.messages.push(message);
          // Keep the latest message
          if (new Date(message.created_at) > new Date(existing.last_message.created_at)) {
            existing.last_message = message;
          }
        }
      });

      // Get other user profiles
      const otherUserIds = Array.from(conversationMap.values()).map(conv => conv.other_user_id);
      
      if (otherUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', otherUserIds);

        // Build final conversations array
        const conversationsArray = Array.from(conversationMap.values()).map(conv => {
          const otherUserProfile = profilesData?.find(p => p.user_id === conv.other_user_id);
          const unreadCount = conv.messages.filter(
            (m: Message) => m.receiver_id === user?.id && !m.is_read
          ).length;

          return {
            id: conv.id,
            other_user: otherUserProfile,
            last_message: conv.last_message,
            unread_count: unreadCount,
          };
        });

        // Sort by last message date
        conversationsArray.sort((a, b) => 
          new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
        );

        setConversations(conversationsArray);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsSending(true);
    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          receiver_id: conversation.other_user.user_id,
          content: newMessage,
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('-');
  };

  const startNewConversation = async (otherUserId: string) => {
    const conversationId = generateConversationId(user?.id || '', otherUserId);
    setSelectedConversation(conversationId);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-white/10 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4">
                    {conversations
                      .filter(conv => 
                        !searchTerm || 
                        conv.other_user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${
                            selectedConversation === conversation.id ? 'bg-primary/10 border border-primary/20' : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10 border border-primary/20">
                            <AvatarImage src={conversation.other_user.avatar_url} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {conversation.other_user.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate">{conversation.other_user.full_name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.last_message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message.content}
                            </p>
                          </div>
                          {conversation.unread_count > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation && selectedConversationData ? (
              <Card className="glass-card border-white/10 h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={selectedConversationData.other_user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {selectedConversationData.other_user.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversationData.other_user.full_name}</h3>
                        {selectedConversationData.other_user.headline && (
                          <p className="text-sm text-muted-foreground">
                            {selectedConversationData.other_user.headline}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender_id === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="glass-card border-white/10 h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
