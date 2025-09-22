// src/components/LeaveRequestsList.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
  employee?: {
    full_name: string;
    employee_id: string;
    department?: string;
  } | null;
}

interface LeaveRequestsListProps {
  limit?: number;
  showActions?: boolean;
}

export default function LeaveRequestsList({
  limit,
  showActions = false,
}: LeaveRequestsListProps) {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setError(null);
      console.log("Fetching leave requests...");

      // First, try to fetch leave requests without joins
      const { data: leaveRequestsData, error: leaveRequestsError } =
        await supabase
          .from("leave_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit || 100);

      if (leaveRequestsError) {
        console.error("Error fetching leave requests:", leaveRequestsError);
        setError(
          `Error fetching leave requests: ${leaveRequestsError.message}`
        );

        // If table doesn't exist, show helpful message
        if (
          leaveRequestsError.code === "PGRST116" ||
          leaveRequestsError.message?.includes("does not exist")
        ) {
          setError(
            "Leave requests table not found. Please run the database setup first."
          );
        }

        setRequests([]);
        return;
      }

      console.log("Leave requests data:", leaveRequestsData);

      if (!leaveRequestsData || leaveRequestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get unique employee IDs
      const employeeIds = [
        ...new Set(leaveRequestsData.map((req) => req.employee_id)),
      ];

      // Fetch employee profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, employee_id, department")
        .in("id", employeeIds);

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError);
        // Continue without profile data
      }

      console.log("Profiles data:", profilesData);

      // Combine the data
      const transformedData = leaveRequestsData.map((request: any) => {
        const employeeProfile = profilesData?.find(
          (profile) => profile.id === request.employee_id
        );

        return {
          id: request.id,
          employee_id: request.employee_id,
          leave_type: request.leave_type,
          start_date: request.start_date,
          end_date: request.end_date,
          total_days: request.total_days,
          reason: request.reason,
          status: request.status,
          rejection_reason: request.rejection_reason,
          created_at: request.created_at,
          employee: employeeProfile
            ? {
                full_name: employeeProfile.full_name,
                employee_id: employeeProfile.employee_id,
                department: employeeProfile.department,
              }
            : null,
        };
      });

      console.log("Transformed data:", transformedData);
      setRequests(transformedData);
    } catch (error) {
      console.error("Unexpected error fetching leave requests:", error);
      setError("An unexpected error occurred while fetching leave requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error approving request:", error);
        alert("Error approving request: " + error.message);
      } else {
        console.log("Request approved successfully");
        fetchLeaveRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("An unexpected error occurred while approving the request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason || reason.trim() === "") {
      alert("Please provide a reason for rejection.");
      return;
    }

    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting request:", error);
        alert("Error rejecting request: " + error.message);
      } else {
        console.log("Request rejected successfully");
        fetchLeaveRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("An unexpected error occurred while rejecting the request.");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--ring)' }}></div>
        <p className="mt-2 text-[var(--muted)]">Loading leave requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: 'color-mix(in oklab, var(--danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)' }}>
        <div className="flex items-center">
          <span className="text-xl mr-2" style={{ color: 'var(--danger)' }}>⚠️</span>
          <div>
            <h3 className="font-medium" style={{ color: 'var(--danger)' }}>
              Error Loading Leave Requests
            </h3>
            <p className="text-sm mt-1" style={{ color: 'color-mix(in oklab, var(--danger) 80%, var(--foreground))' }}>{error}</p>
            <button
              onClick={fetchLeaveRequests}
              className="mt-2 text-sm ui-btn ui-btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <span className="text-6xl mb-4 block">📝</span>
        <h3 className="text-lg font-medium mb-2">
          No leave requests found
        </h3>
        <p className="text-gray-500">
          Leave requests will appear here once employees submit them.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leave Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              {showActions && isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium">
                      {request.employee?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.employee?.employee_id && (
                        <>
                          {request.employee.employee_id}
                          {request.employee.department &&
                            ` • ${request.employee.department}`}
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatLeaveType(request.leave_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDate(request.start_date)} -{" "}
                  {formatDate(request.end_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {request.total_days}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    style={{
                      backgroundColor: request.status === 'approved'
                        ? 'color-mix(in oklab, var(--success) 20%, transparent)'
                        : request.status === 'rejected'
                        ? 'color-mix(in oklab, var(--danger) 20%, transparent)'
                        : 'color-mix(in oklab, var(--ring) 20%, transparent)',
                      color: request.status === 'approved'
                        ? 'var(--success)'
                        : request.status === 'rejected'
                        ? 'var(--danger)'
                        : 'var(--ring)'
                    }}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">
                  <div title={request.reason}>{request.reason}</div>
                  {request.status === "rejected" &&
                    request.rejection_reason && (
                      <div className="text-xs mt-1" title={request.rejection_reason} style={{ color: 'var(--danger)' }}>
                        Rejected: {request.rejection_reason}
                      </div>
                    )}
                </td>
                {showActions && isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="ui-btn ui-btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: 'var(--success)' }}
                        >
                          {actionLoading === request.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt(
                              "Please provide a reason for rejection:"
                            );
                            if (reason) handleReject(request.id, reason);
                          }}
                          disabled={actionLoading === request.id}
                          className="ui-btn ui-btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: 'var(--danger)' }}
                        >
                          {actionLoading === request.id ? "..." : "Reject"}
                        </button>
                      </div>
                    )}
                    {request.status !== "pending" && (
                      <span className="text-gray-500 text-xs">
                        {request.status === "approved"
                          ? "Approved"
                          : "Rejected"}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
