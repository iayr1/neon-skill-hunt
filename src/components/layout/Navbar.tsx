import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, User, Bell, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const AuthButtons = () => {
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <div className="hidden md:flex items-center space-x-2">
        <Link to="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
        <Button variant="ghost" onClick={signOut}>Sign Out</Button>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-2">
      <Link to="/auth">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link to="/auth">
        <Button variant="neon">Get Started</Button>
      </Link>
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl neon-text">SkillHunt</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/jobs" className="text-foreground hover:text-primary transition-smooth">
              Find Jobs
            </Link>
            <Link to="/companies" className="text-foreground hover:text-primary transition-smooth">
              Companies
            </Link>
            <Link to="/networking" className="text-foreground hover:text-primary transition-smooth">
              Network
            </Link>
            <Link to="/insights" className="text-foreground hover:text-primary transition-smooth">
              Insights
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              className="glass w-80 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
            </Button>

            {/* Profile */}
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>

            {/* Auth Buttons */}
            <AuthButtons />

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col space-y-4">
              <Link to="/jobs" className="text-foreground hover:text-primary transition-smooth">
                Find Jobs
              </Link>
              <Link to="/companies" className="text-foreground hover:text-primary transition-smooth">
                Companies
              </Link>
              <Link to="/networking" className="text-foreground hover:text-primary transition-smooth">
                Network
              </Link>
              <Link to="/insights" className="text-foreground hover:text-primary transition-smooth">
                Insights
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <AuthButtons />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;