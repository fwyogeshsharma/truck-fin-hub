import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TruckIcon, IndianRupee, Users, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TruckFin
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Fast Financing for India's
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Trucking Industry</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect load owners, transporters, and lenders on one platform. Get invoice financing in hours, not days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "₹500Cr+", label: "Financed" },
              { value: "10,000+", label: "Trips Completed" },
              { value: "12-18%", label: "Returns for Lenders" },
              { value: "24-48hr", label: "Funding Speed" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How TruckFin Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A seamless platform connecting all stakeholders in logistics financing
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Create Trip",
                desc: "Load owner posts trip details and requests financing",
                icon: TruckIcon,
              },
              {
                step: "2",
                title: "Lenders Bid",
                desc: "Multiple lenders compete with interest rates",
                icon: IndianRupee,
              },
              {
                step: "3",
                title: "Get Funded",
                desc: "Best offer selected, funds disbursed instantly",
                icon: Users,
              },
              {
                step: "4",
                title: "Complete & Repay",
                desc: "Transporter delivers, automatic repayment with returns",
                icon: Shield,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary/20 mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits by Role */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits for Everyone</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                role: "Load Owners",
                color: "primary",
                benefits: [
                  "Get 80% invoice financing instantly",
                  "Improve cash flow for operations",
                  "Competitive interest rates",
                  "Digital documentation",
                ],
              },
              {
                role: "Transporters",
                color: "secondary",
                benefits: [
                  "Receive payments faster",
                  "Reduce payment delays",
                  "Focus on logistics",
                  "Build credit history",
                ],
              },
              {
                role: "Lenders",
                color: "accent",
                benefits: [
                  "12-18% returns on investment",
                  "Short-term lending (7-30 days)",
                  "Risk assessment tools",
                  "Diversified portfolio",
                ],
              },
              {
                role: "Admins",
                color: "primary",
                benefits: [
                  "Complete system oversight",
                  "Fraud detection tools",
                  "Compliance management",
                  "Dispute resolution",
                ],
              },
            ].map((item) => (
              <Card key={item.role} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h3 className={`text-xl font-bold mb-4 text-${item.color}`}>{item.role}</h3>
                  <ul className="space-y-3">
                    {item.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-5 w-5 text-${item.color} flex-shrink-0 mt-0.5`} />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Your Logistics Financing?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses already using TruckFin
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                Start Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 TruckFin. Revolutionizing logistics financing in India.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
