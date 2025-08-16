-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  experience_level TEXT DEFAULT 'entry',
  looking_for_work BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  logo_url TEXT,
  cover_url TEXT,
  location TEXT,
  founded_year INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  location TEXT,
  job_type TEXT DEFAULT 'full-time',
  experience_level TEXT DEFAULT 'mid',
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'USD',
  is_remote BOOLEAN DEFAULT false,
  skills TEXT[],
  requirements TEXT[],
  benefits TEXT[],
  status TEXT DEFAULT 'active',
  posted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user skills table
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  endorsements_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create experiences table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create educations table
CREATE TABLE public.educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  grade TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for companies
CREATE POLICY "Companies are viewable by everyone" 
ON public.companies FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create companies" 
ON public.companies FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company creators can update their companies" 
ON public.companies FOR UPDATE 
USING (auth.uid() = created_by);

-- Create RLS policies for jobs
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create jobs" 
ON public.jobs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Job posters can update their jobs" 
ON public.jobs FOR UPDATE 
USING (auth.uid() = posted_by);

-- Create RLS policies for job applications
CREATE POLICY "Users can view their own applications" 
ON public.job_applications FOR SELECT 
USING (auth.uid() = applicant_id);

CREATE POLICY "Job posters can view applications for their jobs" 
ON public.job_applications FOR SELECT 
USING (auth.uid() IN (SELECT posted_by FROM public.jobs WHERE id = job_id));

CREATE POLICY "Users can create their own applications" 
ON public.job_applications FOR INSERT 
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications" 
ON public.job_applications FOR UPDATE 
USING (auth.uid() = applicant_id);

-- Create RLS policies for connections
CREATE POLICY "Users can view their connections" 
ON public.connections FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests" 
ON public.connections FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connection requests they're involved in" 
ON public.connections FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view their messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Create RLS policies for posts
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);

-- Create RLS policies for post likes
CREATE POLICY "Post likes are viewable by everyone" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like posts" 
ON public.post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
ON public.post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for post comments
CREATE POLICY "Post comments are viewable by everyone" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = author_id);

-- Create RLS policies for skills
CREATE POLICY "Skills are viewable by everyone" 
ON public.skills FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create skills" 
ON public.skills FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create RLS policies for user skills
CREATE POLICY "User skills are viewable by everyone" 
ON public.user_skills FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own skills" 
ON public.user_skills FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for experiences
CREATE POLICY "User experiences are viewable by everyone" 
ON public.experiences FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own experiences" 
ON public.experiences FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for educations
CREATE POLICY "User educations are viewable by everyone" 
ON public.educations FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own educations" 
ON public.educations FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educations_updated_at
  BEFORE UPDATE ON public.educations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some initial skills
INSERT INTO public.skills (name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('SQL', 'Database'),
('Project Management', 'Management'),
('UI/UX Design', 'Design'),
('Marketing', 'Business'),
('Sales', 'Business'),
('Data Analysis', 'Analytics');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('covers', 'covers', true),
('resumes', 'resumes', false),
('company-logos', 'company-logos', true),
('post-images', 'post-images', true);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for covers
CREATE POLICY "Cover images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for resumes
CREATE POLICY "Users can view their own resumes" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own resumes" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for company logos
CREATE POLICY "Company logos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'company-logos');

-- Create storage policies for post images
CREATE POLICY "Post images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload post images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'post-images');