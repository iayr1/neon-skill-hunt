import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  UserPlus,
  MessageCircle,
  Building,
  GraduationCap,
  Award
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  avatar_url: string;
  cover_url: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  phone: string;
  email: string;
  looking_for_work: boolean;
  experience_level: string;
}

interface Experience {
  id: string;
  company_name: string;
  position: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  grade: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  endorsements_count: number;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const targetUserId = userId || user.id;
      setIsOwnProfile(!userId || userId === user.id);
      fetchProfile(targetUserId);
      fetchExperiences(targetUserId);
      fetchEducations(targetUserId);
      fetchSkills(targetUserId);
    }
  }, [user, userId]);

  const fetchProfile = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExperiences = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    }
  };

  const fetchEducations = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('educations')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEducations(data || []);
    } catch (error) {
      console.error('Error fetching educations:', error);
    }
  };

  const fetchSkills = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          id,
          endorsements_count,
          skills!inner(id, name, category)
        `)
        .eq('user_id', targetUserId);

      if (error) throw error;
      
      const formattedSkills = data?.map(item => ({
        id: item.skills.id,
        name: item.skills.name,
        category: item.skills.category,
        endorsements_count: item.endorsements_count
      })) || [];
      
      setSkills(formattedSkills);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
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

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card className="glass-card border-white/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
              <p className="text-muted-foreground">This user profile doesn't exist or is private.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="glass-card border-white/10">
              <div className="relative">
                {profile.cover_url && (
                  <div className="h-32 bg-gradient-primary rounded-t-lg"></div>
                )}
                <CardContent className={`p-6 ${profile.cover_url ? '-mt-16' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                    <Avatar className="h-24 w-24 border-4 border-background">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                        {profile.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                          {profile.headline && (
                            <p className="text-muted-foreground text-lg">{profile.headline}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            {profile.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{profile.location}</span>
                              </div>
                            )}
                            {profile.looking_for_work && (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Open to work
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-4 sm:mt-0">
                          {isOwnProfile ? (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Connect
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* About */}
            {profile.bio && (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Experience</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{exp.position}</h3>
                          <p className="text-primary font-medium">{exp.company_name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                            </span>
                            {exp.location && (
                              <>
                                <span>•</span>
                                <span>{exp.location}</span>
                              </>
                            )}
                          </div>
                          {exp.description && (
                            <p className="mt-3 text-foreground whitespace-pre-wrap">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {educations.length > 0 && (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>Education</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {educations.map((edu) => (
                    <div key={edu.id} className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-lg">{edu.institution}</h3>
                      <p className="text-primary font-medium">{edu.degree}</p>
                      {edu.field_of_study && (
                        <p className="text-muted-foreground">{edu.field_of_study}</p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                        </span>
                        {edu.grade && (
                          <>
                            <span>•</span>
                            <span>Grade: {edu.grade}</span>
                          </>
                        )}
                      </div>
                      {edu.description && (
                        <p className="mt-3 text-foreground whitespace-pre-wrap">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Contact Info */}
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle>Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center space-x-3">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-primary hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div className="flex items-center space-x-3">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-primary hover:underline">
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {profile.github_url && (
                    <div className="flex items-center space-x-3">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-primary hover:underline">
                        GitHub
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Skills</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between">
                          <Badge variant="outline">{skill.name}</Badge>
                          {skill.endorsements_count > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {skill.endorsements_count} endorsements
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;