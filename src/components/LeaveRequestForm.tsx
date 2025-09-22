// src/components/LeaveRequestForm.tsx
"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface LeaveRequestFormProps {
  onSuccess?: () => void;
}

export default function LeaveRequestForm({ onSuccess }: LeaveRequestFormProps) {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const leaveTypes = [
    { value: "vacation", label: "Vacation" },
    { value: "sick", label: "Sick Leave" },
    { value: "personal", label: "Personal Leave" },
    { value: "emergency", label: "Emergency Leave" },
    { value: "maternity", label: "Maternity Leave" },
    { value: "paternity", label: "Paternity Leave" },
  ];

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const testConnection = async () => {
    try {
      console.log("🔍 Testing Supabase connection...");
      
      // Test 1: Check auth
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log("Auth test:", { currentUser: currentUser?.id, authError });

      // Test 2: Check profile access
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      console.log("Profile test:", { profileData, profileError });

      // Test 3: Check leave_requests table access
      const { data: tableTest, error: tableError } = await supabase
        .from("leave_requests")
        .select("id")
        .limit(1);
      console.log("Table access test:", { tableTest, tableError });

      // Test 4: Check if we can query with current user
      const { data: policyTest, error: policyError } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", user?.id);
      console.log("Policy test:", { policyTest, policyError });

      setDebugInfo({
        auth: { user: currentUser?.id, error: authError?.message },
        profile: { data: profileData?.id, error: profileError?.message },
        table: { accessible: !tableError, error: tableError?.message },
        policy: { accessible: !policyError, error: policyError?.message }
      });

    } catch (error) {
      console.error("Connection test failed:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setMessage("❌ Request timeout. Please try again.");
    }, 30000); // 30 second timeout

    try {
      console.log("🚀 Starting leave request submission...");
      
      // Pre-flight checks
      if (!user || !profile) {
        setMessage("❌ Error: Please sign out and sign back in");
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const totalDays = calculateDays(formData.start_date, formData.end_date);
      if (totalDays <= 0) {
        setMessage("❌ End date must be after start date");
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      // Prepare clean request data
      const requestPayload = {
        employee_id: user.id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: totalDays,
        reason: formData.reason.trim(),
        status: "pending"
      };

      console.log("📝 Request payload:", requestPayload);
      setMessage("⏳ Submitting request...");

      // Try the insert with a more direct approach
      const { data, error } = await supabase
        .from("leave_requests")
        .insert([requestPayload])
        .select();

      console.log("📤 Insert result:", { data, error });

      // Clear timeout on response
      clearTimeout(timeoutId);

      if (error) {
        console.error("❌ Insert error:", error);
        
        // Handle specific errors with better messages
        if (error.code === '42501' || error.message?.includes('permission')) {
          setMessage("❌ Permission denied. Please contact administrator to fix database permissions.");
        } else if (error.code === '23503') {
          setMessage("❌ Database relationship error. Please contact administrator.");
        } else if (error.code === 'PGRST116') {
          setMessage("❌ Database table not found. Please contact administrator.");
        } else {
          setMessage(`❌ Database error: ${error.message}`);
        }
        
        setLoading(false);
        return;
      }

      // Success!
      console.log("✅ Leave request submitted successfully:", data);
      setMessage("🎉 Leave request submitted successfully!");
      
      // Clear form
      setFormData({
        leave_type: "",
        start_date: "",
        end_date: "",
        reason: "",
      });

      // Trigger refresh
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }

    } catch (error) {
      console.error("💥 Unexpected error:", error);
      setMessage(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="ui-section-title text-base">Submit Leave Request</h3>
        <button
          onClick={testConnection}
          className="ui-btn ui-btn-secondary text-xs"
        >
          Test Connection
        </button>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong className="text-yellow-800">Debug Results:</strong><br />
          <span className="text-yellow-700">
            Auth: {debugInfo.auth.user ? "✅" : "❌"} {debugInfo.auth.error}<br />
            Profile: {debugInfo.profile.data ? "✅" : "❌"} {debugInfo.profile.error}<br />
            Table: {debugInfo.table.accessible ? "✅" : "❌"} {debugInfo.table.error}<br />
            Policy: {debugInfo.policy.accessible ? "✅" : "❌"} {debugInfo.policy.error}
          </span>
        </div>
      )}

      {/* User Status */}
      <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'color-mix(in oklab, var(--ring) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--ring) 30%, transparent)' }}>
        <strong>Status:</strong> <span>{user ? "🟢 Logged in" : "🔴 Not logged in"}</span><br />
        <strong>User ID:</strong> <span>{user?.id || "None"}</span><br />
        <strong>Profile:</strong> <span>{profile?.full_name || "No profile"} ({profile?.user_role})</span><br />
        <strong>Employee ID:</strong> <span>{profile?.employee_id || "None"}</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              required
              disabled={loading}
              className="ui-input disabled:opacity-60"
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required
                disabled={loading}
                className="ui-input disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date || new Date().toISOString().split("T")[0]}
                required
                disabled={loading}
                className="ui-input disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {formData.start_date && formData.end_date && (
          <div className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in oklab, var(--success) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)' }}>
            <strong style={{ color: 'var(--success)' }}>📅 Total days:</strong> <span>{calculateDays(formData.start_date, formData.end_date)} days</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason *
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
            rows={4}
            disabled={loading}
            className="ui-input disabled:opacity-60"
            placeholder="Please provide a detailed reason for your leave request..."
          />
        </div>

        {message && (
          <div className={`text-sm p-4 rounded-lg border`} style={{
            backgroundColor: message.includes("🎉") || message.includes("successfully")
              ? 'color-mix(in oklab, var(--success) 10%, transparent)'
              : message.includes("⏳")
              ? 'color-mix(in oklab, var(--ring) 10%, transparent)'
              : 'color-mix(in oklab, var(--danger) 10%, transparent)',
            border: '1px solid ' + (message.includes("🎉") || message.includes("successfully")
              ? 'color-mix(in oklab, var(--success) 30%, transparent)'
              : message.includes("⏳")
              ? 'color-mix(in oklab, var(--ring) 30%, transparent)'
              : 'color-mix(in oklab, var(--danger) 30%, transparent)')
          }}>
            <div className="font-medium">{message}</div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
              setMessage("");
              setDebugInfo(null);
            }}
            disabled={loading}
            className="ui-btn ui-btn-secondary"
          >
            Clear Form
          </button>
          
          <button
            type="submit"
            disabled={loading || !user || !profile}
            className="ui-btn ui-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-white">Submitting...</span>
              </>
            ) : (
              <span className="text-white">🚀 Submit Request</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}