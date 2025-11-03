import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-4xl font-bold font-heading mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist. Head back to the dashboard to get started.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:shadow-glow transition-all"
        >
          <Home className="h-5 w-5" />
          Back to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
