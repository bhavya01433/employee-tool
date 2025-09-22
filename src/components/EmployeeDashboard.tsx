"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "./Sidebar";
import StatsCard from "@/components/StatsCard";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import MyLeaveRequests from "@/components/MyLeaveRequests";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

interface EmployeeStats {
  totalLeavesTaken: number;
  pendingRequests: number;
  approvedRequests: number;
  remainingVacation: number;
}

export default function EmployeeDashboard() {
  const { profile, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<EmployeeStats>({
    totalLeavesTaken: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    remainingVacation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
    hire_date: "",
  });

  useEffect(() => {
    fetchEmployeeStats();
  }, [profile]);

  const fetchEmployeeStats = async () => {
    if (!profile) return;

    try {
      // Fetch employee's leave requests
      const { data: leaveRequests } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", profile.id);

      // Fetch vacation balance
      const { data: vacationBalance } = await supabase
        .from("leave_balances")
        .select("remaining_days")
        .eq("employee_id", profile.id)
        .eq("leave_type", "vacation")
        .eq("year", new Date().getFullYear())
        .single();

      const totalLeavesTaken =
        leaveRequests?.filter((r) => r.status === "approved").length || 0;
      const pendingRequests =
        leaveRequests?.filter((r) => r.status === "pending").length || 0;
      const approvedRequests =
        leaveRequests?.filter((r) => r.status === "approved").length || 0;

      setStats({
        totalLeavesTaken,
        pendingRequests,
        approvedRequests,
        remainingVacation: vacationBalance?.remaining_days || 0,
      });
    } catch (error) {
      console.error("Error fetching employee stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        department: profile.department || "",
        position: profile.position || "",
        hire_date: profile.hire_date ? new Date(profile.hire_date).toISOString().slice(0, 10) : "",
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updates: any = {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone || null,
        address: editForm.address || null,
        department: editForm.department || null,
        position: editForm.position || null,
        hire_date: editForm.hire_date ? new Date(editForm.hire_date).toISOString() : null,
      };
      // Ensure employee_id is never updated
      delete updates.employee_id;
      const { error } = await updateProfile(updates);
      if (!error) {
        setIsEditing(false);
      } else {
        console.error("Failed to update profile:", error);
      }
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "leave-request", label: "Request Leave", icon: "📝" },
    { id: "my-leaves", label: "My Leave Requests", icon: "📋" },
    { id: "leave-balance", label: "Leave Balance", icon: "⚖️" },
    { id: "profile", label: "My Profile", icon: "👤" },
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
              Welcome, {profile?.full_name}
            </h1>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                  {profile?.full_name?.charAt(0) || "E"}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {profile?.full_name}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {profile?.position}
                  </div>
                </div>
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
                  title="Leaves Taken"
                  value={stats.totalLeavesTaken}
                  icon="✈️"
                  color="blue"
                />
                <StatsCard
                  title="Pending Requests"
                  value={stats.pendingRequests}
                  icon="⏳"
                  color="yellow"
                />
                <StatsCard
                  title="Approved Requests"
                  value={stats.approvedRequests}
                  icon="✅"
                  color="green"
                />
                <StatsCard
                  title="Vacation Days Left"
                  value={stats.remainingVacation}
                  icon="🌴"
                  color="purple"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("leave-request")}
                      className="w-full text-left p-3 rounded-lg border border-[var(--card-border)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📝</span>
                        <div>
                          <div className="font-medium">
                            Request Leave
                          </div>
                          <div className="text-sm text-[var(--muted)]">
                            Submit a new leave request
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("leave-balance")}
                      className="w-full text-left p-3 rounded-lg border border-[var(--card-border)] hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">⚖️</span>
                        <div>
                          <div className="font-medium">
                            Check Leave Balance
                          </div>
                          <div className="text-sm text-[var(--muted)]">
                            View your available leave days
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="ui-card p-6">
                  <h3 className="ui-section-title mb-4">
                    Recent Leave Requests
                  </h3>
                  <MyLeaveRequests limit={3} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "leave-request" && (
            <div className="max-w-2xl">
              <h2 className="ui-section-title mb-6">
                Submit Leave Request
              </h2>
              <LeaveRequestForm onSuccess={() => setActiveTab("my-leaves")} />
            </div>
          )}

          {activeTab === "my-leaves" && (
            <div className="space-y-6">
              <h2 className="ui-section-title">
                My Leave Requests
              </h2>
              <MyLeaveRequests />
            </div>
          )}

          {activeTab === "leave-balance" && (
            <div className="space-y-6">
              <h2 className="ui-section-title">
                Leave Balance
              </h2>
              <LeaveBalanceCard employeeId={profile?.id} />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <h2 className="ui-section-title">
                My Profile
              </h2>
              <div className="ui-card p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">{profile?.full_name}</div>
                      ) : (
                        <input
                          type="text"
                          className="ui-input mt-1"
                          placeholder="Enter your full name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">{profile?.email}</div>
                      ) : (
                        <input
                          type="email"
                          className="ui-input mt-1"
                          placeholder="Enter your email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employee ID
                      </label>
                      <div className="mt-1 text-sm">{profile?.employee_id}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Department
                      </label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">{profile?.department || "Not assigned"}</div>
                      ) : (
                        <input
                          type="text"
                          className="ui-input mt-1"
                          placeholder="Enter your department"
                          value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Position
                      </label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">{profile?.position || "Not assigned"}</div>
                      ) : (
                        <input
                          type="text"
                          className="ui-input mt-1"
                          placeholder="Enter your position"
                          value={editForm.position}
                          onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hire Date
                      </label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">
                          {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : "Not set"}
                        </div>
                      ) : (
                        <input
                          type="date"
                          className="ui-input mt-1"
                          value={editForm.hire_date}
                          onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm">{profile?.phone || "Not set"}</div>
                      ) : (
                        <input
                          type="tel"
                          className="ui-input mt-1"
                          placeholder="Enter your phone number"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      {!isEditing ? (
                        <div className="mt-1 text-sm break-words">{profile?.address || "Not set"}</div>
                      ) : (
                        <input
                          type="text"
                          className="ui-input mt-1"
                          placeholder="Enter your address"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    {!isEditing ? (
                      <button
                        className="ui-btn ui-btn-primary"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          className="ui-btn ui-btn-secondary"
                          onClick={() => {
                            setIsEditing(false);
                            if (profile) {
                              setEditForm({
                                full_name: profile.full_name || "",
                                email: profile.email || "",
                                phone: profile.phone || "",
                                address: profile.address || "",
                                department: profile.department || "",
                                position: profile.position || "",
                                hire_date: profile.hire_date ? new Date(profile.hire_date).toISOString().slice(0, 10) : "",
                              });
                            }
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="ui-btn"
                          style={{ backgroundColor: "var(--success)", color: "#fff" }}
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
