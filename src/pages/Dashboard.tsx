import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Send, Briefcase, Users, TrendingUp, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  full_name: string;
  headline: string;
  avatar_url: string | null;
  location: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id: string;
  profiles: Profile; // embedded author profile
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Normalize to match Profile interface
      const normalized: Profile = {
        id: data.id,
        full_name: data.full_name ?? '',
        headline: data.headline ?? '',
        avatar_url: data.avatar_url ?? null,
        location: data.location ?? null,
      };

      setProfile(normalized);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // IMPORTANT: Use alias join syntax profiles:author_id(...)
      // This returns a field "profiles" containing the related profile,
      // where profiles.id = posts.author_id.
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, image_url, likes_count, comments_count, shares_count, created_at, author_id,
          profiles:author_id ( id, full_name, headline, avatar_url, location )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Defensive narrowing: ensure each row has an embedded profiles object
      const sanitized = (data ?? []).filter(
        (row: any) =>
          row &&
          row.id &&
          row.profiles &&
          typeof row.profiles === 'object' &&
          row.profiles.id &&
          typeof row.profiles.full_name === 'string'
      ) as Post[];

      setPosts(sanitized);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          author_id: user.id,
        });

      if (error) throw error;

      setNewPost('');
      fetchPosts();
      toast({
        title: 'Post created!',
        description: 'Your post has been shared with your network.',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating post',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    try {
      // Check if user already liked the post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle(); // tolerate no row without throwing

      if (existingLike) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Update likes count via RPC (ensure these functions exist in DB)
        await supabase.rpc('decrement_likes_count', { post_id: postId });
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        // Update likes count via RPC
        await supabase.rpc('increment_likes_count', { post_id: postId });
      }

      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-white/10 sticky top-24">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{profile?.full_name || 'Welcome!'}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {profile?.headline || 'Complete your profile to get started'}
                  </p>
                  {profile?.location && (
                    <p className="text-sm text-muted-foreground">{profile.location}</p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profile views</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connections</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card className="glass-card border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[100px] border-white/10 resize-none"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Photo
                        </Button>
                      </div>
                      <Button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isPosting}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isPosting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="glass-card border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12 border border-primary/20">
                        <AvatarImage src={post.profiles.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {post.profiles.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{post.profiles.full_name}</h4>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {post.profiles.headline && (
                          <p className="text-sm text-muted-foreground">{post.profiles.headline}</p>
                        )}
                        <div className="mt-3">
                          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {post.image_url && (
                          <div className="mt-4">
                            <img
                              src={post.image_url}
                              alt="Post content"
                              className="rounded-lg max-h-96 w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center space-x-2"
                          >
                            <Heart className="h-4 w-4" />
                            <span>{post.likes_count}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments_count}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                            <Share2 className="h-4 w-4" />
                            <span>{post.shares_count}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {posts.length === 0 && (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">Be the first to share something with your network!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Quick Stats */}
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Your Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Connections</span>
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-sm">Jobs Applied</span>
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm">Profile Views</span>
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Skills */}
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Trending Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">AI/ML</Badge>
                    <Badge variant="outline">DevOps</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
