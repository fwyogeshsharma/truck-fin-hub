import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TruckIcon, Wallet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";

const AdminDashboard = () => {
  const allTrips = data.getTrips();
  const allUsers = auth.getAllUsers();
  const allInvestments = data.getInvestments();

  const stats = [
    {
      title: "Total Users",
      value: allUsers.length,
      icon: Users,
      color: "primary",
      detail: `${allUsers.filter(u => u.role === 'lender').length} Lenders, ${allUsers.filter(u => u.role === 'load_owner').length} Load Providers`,
    },
    {
      title: "Total Trips",
      value: allTrips.length,
      icon: TruckIcon,
      color: "secondary",
      detail: `${allTrips.filter(t => t.status === 'completed').length} Completed`,
    },
    {
      title: "Platform Volume",
      value: `₹${(allTrips.reduce((sum, t) => sum + t.amount, 0) / 100000).toFixed(1)}L`,
      icon: Wallet,
      color: "accent",
      detail: `${allInvestments.length} Active investments`,
    },
    {
      title: "Pending Issues",
      value: "0",
      icon: AlertTriangle,
      color: "destructive",
      detail: "All systems operational",
    },
  ];

  const systemHealth = [
    { metric: "Payment Processing", status: "operational", uptime: "99.9%" },
    { metric: "User Authentication", status: "operational", uptime: "100%" },
    { metric: "Trip Management", status: "operational", uptime: "99.8%" },
    { metric: "Wallet System", status: "operational", uptime: "99.9%" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time platform status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.map((item) => (
                <div key={item.metric} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <span className="font-medium">{item.metric}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Uptime: {item.uptime}</span>
                    <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
              <CardDescription>Latest trip activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allTrips.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{trip.origin} → {trip.destination}</p>
                      <p className="text-xs text-muted-foreground">{trip.loadOwnerName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trip.status === 'completed' ? 'bg-secondary/20 text-secondary' :
                      trip.status === 'funded' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>New registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {user.role && (
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
