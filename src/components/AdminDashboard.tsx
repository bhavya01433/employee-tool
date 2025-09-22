"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "./Sidebar";
import StatsCard from "./StatsCard";
import LeaveRequestsList from "./LeaveRequestsList";
import EmployeesList from "./EmployeesList";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

interface DashboardStats {
  totalEmployees: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch leave requests stats
      const { data: leaveStats } = await supabase
        .from("leave_requests")
        .select("status");

      const pendingLeaves =
        leaveStats?.filter((l) => l.status === "pending").length || 0;
      const approvedLeaves =
        leaveStats?.filter((l) => l.status === "approved").length || 0;
      const rejectedLeaves =
        leaveStats?.filter((l) => l.status === "rejected").length || 0;

      setStats({
        totalEmployees: employeeCount || 0,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "leave-requests", label: "Leave Requests", icon: "📝" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userProfile={profile}
        onSignOut={signOut}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[var(--card-bg)] shadow-sm border-b border-[var(--card-border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                  {profile?.full_name?.charAt(0) || "A"}
                </div>
                <span className="text-sm">
                  {profile?.full_name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Employees"
                  value={stats.totalEmployees}
                  icon="👥"
                  color="blue"
                />
                <StatsCard
                  title="Pending Leaves"
                  value={stats.pendingLeaves}
                  icon="⏳"
                  color="yellow"
                />
                <StatsCard
                  title="Approved Leaves"
                  value={stats.approvedLeaves}
                  icon="✅"
                  color="green"
                />
                <StatsCard
                  title="Rejected Leaves"
                  value={stats.rejectedLeaves}
                  icon="❌"
                  color="red"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Recent Leave Requests
                  </h3>
                  <LeaveRequestsList limit={5} showActions={false} />
                </div>
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("employees")}
                      className="w-full text-left p-3 rounded-lg border border-[var(--card-border)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">👥</span>
                        <div>
                          <div className="font-medium">
                            Manage Employees
                          </div>
                          <div className="text-sm text-[var(--muted)]">
                            Add, edit, or deactivate employees
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("leave-requests")}
                      className="w-full text-left p-3 rounded-lg border border-[var(--card-border)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📝</span>
                        <div>
                          <div className="font-medium">
                            Review Leave Requests
                          </div>
                          <div className="text-sm text-[var(--muted)]">
                            Approve or reject pending requests
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "employees" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="ui-section-title">
                  Employee Management
                </h2>
                <button className="ui-btn ui-btn-primary">
                  Add New Employee
                </button>
              </div>
              <EmployeesList />
            </div>
          )}

          {activeTab === "leave-requests" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="ui-section-title">
                  Leave Requests Management
                </h2>
                <div className="flex space-x-2">
                  <select className="ui-input">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <LeaveRequestsList showActions={true} />
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <h2 className="ui-section-title">
                Reports & Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Leave Usage by Department
                  </h3>
                  <div className="text-gray-500">Chart will be here</div>
                </div>
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Monthly Trends
                  </h3>
                  <div className="text-gray-500">Chart will be here</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
