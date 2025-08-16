import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  UserPlus, 
  Users, 
  Clock, 
  Check, 
  X, 
  MapPin,
  Building,
  MessageCircle
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  location: string;
  avatar_url: string;
  experience_level: string;
}

interface Connection {
  id: string;
  status: string;
  message: string;
  created_at: string;
  requester: Profile;
  addressee: Profile;
}

const Networking = () => {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSuggestions();
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      // Get people who aren't already connected
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`);

      const connectedUserIds = existingConnections?.flatMap(conn => 
        [conn.requester_id, conn.addressee_id]
      ).filter(id => id !== user?.id) || [];

      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id)
        .limit(10);

      if (connectedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${connectedUserIds.join(',')})`);
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,headline.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(*),
          addressee:profiles!connections_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(*),
          addressee:profiles!connections_addressee_id_fkey(*)
        `)
        .eq('addressee_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const sendConnectionRequest = async (addresseeId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user?.id,
          addressee_id: addresseeId,
          status: 'pending',
          message: 'I would like to connect with you!'
        });

      if (error) throw error;

      toast({
        title: "Connection request sent!",
        description: "Your request has been sent successfully.",
      });

      fetchSuggestions();
    } catch (error: any) {
      toast({
        title: "Error sending request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConnectionRequest = async (connectionId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: action === 'accept' ? "Connection accepted!" : "Request declined",
        description: action === 'accept' 
          ? "You are now connected!" 
          : "The request has been declined.",
      });

      fetchPendingRequests();
      if (action === 'accept') {
        fetchConnections();
      }
    } catch (error: any) {
      toast({
        title: "Error processing request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [searchTerm, user]);

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Network</h1>
          <p className="text-muted-foreground">Connect with professionals and grow your network</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="connections" className="relative">
              Connections
              {connections.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {connections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search */}
            <Card className="glass-card border-white/10">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people by name, title, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((profile) => (
                <Card key={profile.id} className="glass-card border-white/10 hover:border-primary/20 transition-all">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-primary/20">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {profile.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-lg mb-1">{profile.full_name}</h3>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {profile.headline}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mb-4">
                        {profile.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        {profile.experience_level && (
                          <Badge variant="outline" className="text-xs">
                            {profile.experience_level}
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => sendConnectionRequest(profile.user_id)}
                        size="sm"
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {suggestions.length === 0 && !isLoading && (
              <Card className="glass-card border-white/10">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No suggestions found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search terms to find more people"
                      : "Check back later for new connection suggestions"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection) => {
                const otherUser = connection.requester.user_id === user.id 
                  ? connection.addressee 
                  : connection.requester;
                  
                return (
                  <Card key={connection.id} className="glass-card border-white/10 hover:border-primary/20 transition-all">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-primary/20">
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {otherUser.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="font-semibold text-lg mb-1">{otherUser.full_name}</h3>
                        {otherUser.headline && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {otherUser.headline}
                          </p>
                        )}
                        
                        {otherUser.location && (
                          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mb-4">
                            <MapPin className="h-3 w-3" />
                            <span>{otherUser.location}</span>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {connections.length === 0 && (
              <Card className="glass-card border-white/10">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground">Start building your network by connecting with people!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="glass-card border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={request.requester.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {request.requester.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.requester.full_name}</h3>
                        {request.requester.headline && (
                          <p className="text-sm text-muted-foreground">{request.requester.headline}</p>
                        )}
                        {request.message && (
                          <p className="text-sm mt-2 text-foreground">{request.message}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleConnectionRequest(request.id, 'accept')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectionRequest(request.id, 'reject')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pendingRequests.length === 0 && (
              <Card className="glass-card border-white/10">
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">You don't have any pending connection requests at the moment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Networking;