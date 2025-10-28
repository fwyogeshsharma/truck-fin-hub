import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlayCircle, Youtube } from "lucide-react";
import Footer from "@/components/Footer";

const VideoTutorials = () => {
  const navigate = useNavigate();

  // Sample YouTube video IDs - replace these with your actual tutorial videos
  const tutorials = [
    {
      id: "getting-started",
      title: "Getting Started with LogiFin",
      description: "Learn the basics of LogiFin platform and how to get started with your first transaction.",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "5:30",
      category: "Beginner"
    },
    {
      id: "transporter",
      title: "Transporter Guide - Creating Trip Requests",
      description: "Step-by-step guide on how to create trip financing requests and manage loans.",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "8:45",
      category: "Transporter"
    },
    {
      id: "lender",
      title: "Lender Guide - Making Investments",
      description: "Learn how to find investment opportunities, make bids, and track your investments.",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "10:20",
      category: "Lender"
    },
    {
      id: "wallet",
      title: "Wallet Management",
      description: "Managing your wallet, adding funds, and making withdrawals.",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "6:00",
      category: "Common"
    },
    {
      id: "kyc",
      title: "KYC Verification Process",
      description: "Complete guide to submitting and verifying your KYC documents.",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "5:45",
      category: "Common"
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Beginner":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Transporter":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Lender":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Video Tutorials</h1>
              <p className="text-sm text-muted-foreground">Learn LogiFin through step-by-step video guides</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-600" />
              Welcome to LogiFin Video Tutorials
            </CardTitle>
            <CardDescription>
              Watch our comprehensive video guides to master the LogiFin platform. Videos are organized by user role
              and feature to help you find exactly what you need.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                {/* YouTube Embed */}
                <iframe
                  src={`https://www.youtube.com/embed/${tutorial.videoId}`}
                  title={tutorial.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getCategoryColor(tutorial.category)}`}>
                    {tutorial.category}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {tutorial.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <PlayCircle className="h-4 w-4" />
                    <span>{tutorial.duration}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${tutorial.videoId}`, '_blank')}
                  >
                    Watch on YouTube →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/help/getting-started')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">Getting Started Guide</div>
                  <div className="text-sm text-muted-foreground">Written step-by-step guide</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/help/user-manual')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">User Manual</div>
                  <div className="text-sm text-muted-foreground">Comprehensive documentation</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate('/help/faq')}
              >
                <div className="text-left">
                  <div className="font-semibold mb-1">FAQs</div>
                  <div className="text-sm text-muted-foreground">Frequently asked questions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Note for Admin */}
        <Card className="mt-8 border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Youtube className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Note for Admin</h3>
                <p className="text-sm text-muted-foreground">
                  These are sample YouTube videos. To add your actual tutorial videos, replace the <code className="bg-muted px-1 py-0.5 rounded">videoId</code> values
                  in the <code className="bg-muted px-1 py-0.5 rounded">tutorials</code> array (line 11-46) in{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">src/pages/help/VideoTutorials.tsx</code> with your YouTube video IDs.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>How to get YouTube Video ID:</strong> From a YouTube URL like{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">https://www.youtube.com/watch?v=ABC123</code>,
                  the video ID is <code className="bg-muted px-1 py-0.5 rounded">ABC123</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Footer />
    </div>
  );
};

export default VideoTutorials;
