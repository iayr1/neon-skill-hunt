import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Bookmark,
  Building2,
  Users,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

const jobCategories = [
  "Software Development",
  "Data Science",
  "Design",
  "Marketing",
  "Sales",
  "Product Management",
  "DevOps",
  "Cybersecurity"
];

const jobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120K - $180K",
    tags: ["React", "TypeScript", "Node.js"],
    postedTime: "2 hours ago",
    applicants: 23,
    isRemote: true,
    isUrgent: false
  },
  {
    id: 2,
    title: "AI/ML Engineer",
    company: "DataFlow Solutions",
    location: "Remote",
    type: "Full-time",
    salary: "$140K - $200K",
    tags: ["Python", "TensorFlow", "AWS"],
    postedTime: "4 hours ago",
    applicants: 45,
    isRemote: true,
    isUrgent: true
  },
  {
    id: 3,
    title: "UX/UI Designer",
    company: "Creative Studios",
    location: "New York, NY",
    type: "Contract",
    salary: "$80K - $120K",
    tags: ["Figma", "Adobe XD", "Prototyping"],
    postedTime: "1 day ago",
    applicants: 67,
    isRemote: false,
    isUrgent: false
  },
  {
    id: 4,
    title: "DevOps Engineer",
    company: "CloudScale Systems",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$110K - $160K",
    tags: ["Docker", "Kubernetes", "Azure"],
    postedTime: "2 days ago",
    applicants: 34,
    isRemote: true,
    isUrgent: false
  }
];

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Find Your Next{" "}
              <span className="neon-text bg-gradient-primary bg-clip-text text-transparent">
                Opportunity
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover amazing job opportunities that match your skills and career goals.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-6 rounded-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  className="glass w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Location"
                  className="glass w-full lg:w-48 pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Filter Button */}
              <Button variant="glass" className="w-full lg:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Job Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
            <div className="flex flex-wrap gap-2">
              {jobCategories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={`cursor-pointer transition-smooth ${
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground shadow-neon" 
                      : "glass hover:bg-primary/20"
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Job Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="glass-card p-6 rounded-lg hover:scale-[1.02] transition-spring">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {job.title}
                          </h3>
                          {job.isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          {job.isRemote && (
                            <Badge variant="secondary" className="text-xs glass">
                              Remote
                            </Badge>
                          )}
                        </div>
                        <p className="text-primary font-medium text-lg mb-2">{job.company}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="glass text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applicants} applicants
                        </span>
                        <span>{job.postedTime}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost">
                          Learn More
                        </Button>
                        <Button variant="neon">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Alerts */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Job Alerts</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get notified when new jobs matching your criteria are posted.
                </p>
                <Button variant="neon" className="w-full">
                  Set Up Alerts
                </Button>
              </div>

              {/* Trending Skills */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Trending Skills
                </h3>
                <div className="space-y-3">
                  {["React", "Python", "TypeScript", "AWS", "Docker"].map((skill) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm">{skill}</span>
                      <Badge variant="secondary" className="glass text-xs">
                        +12%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Spotlight */}
              <div className="glass-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-secondary" />
                  Featured Companies
                </h3>
                <div className="space-y-3">
                  {["TechCorp Inc.", "DataFlow Solutions", "Creative Studios"].map((company) => (
                    <div key={company} className="flex items-center justify-between">
                      <span className="text-sm">{company}</span>
                      <Badge variant="secondary" className="glass text-xs">
                        Hiring
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;