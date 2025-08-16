import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Target, 
  MessageSquare, 
  Shield, 
  Zap, 
  Network,
  BarChart3,
  Users
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our advanced AI analyzes your skills, experience, and preferences to find perfect job matches.",
    color: "text-primary",
    bgColor: "bg-primary/20"
  },
  {
    icon: Target,
    title: "Smart Job Recommendations",
    description: "Get personalized job suggestions based on your profile and career goals.",
    color: "text-secondary",
    bgColor: "bg-secondary/20"
  },
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description: "Connect instantly with recruiters and hiring managers through our integrated chat system.",
    color: "text-accent",
    bgColor: "bg-accent/20"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is secure and protected. Control who sees your profile and when.",
    color: "text-destructive",
    bgColor: "bg-destructive/20"
  },
  {
    icon: Zap,
    title: "One-Click Apply",
    description: "Apply to multiple jobs instantly with your saved profile and custom cover letters.",
    color: "text-primary",
    bgColor: "bg-primary/20"
  },
  {
    icon: Network,
    title: "Professional Network",
    description: "Build meaningful connections with industry professionals and expand your network.",
    color: "text-secondary",
    bgColor: "bg-secondary/20"
  },
  {
    icon: BarChart3,
    title: "Career Analytics",
    description: "Track your application progress and get insights to improve your job search strategy.",
    color: "text-accent",
    bgColor: "bg-accent/20"
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join a community of professionals sharing experiences, tips, and opportunities.",
    color: "text-destructive",
    bgColor: "bg-destructive/20"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 glass border-primary/30 text-primary bg-primary/10">
            ✨ Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="neon-text bg-gradient-primary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the powerful features that make SkillHunt the ultimate platform 
            for job seekers and employers alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-6 rounded-lg hover:scale-105 transition-spring group"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-spring`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;