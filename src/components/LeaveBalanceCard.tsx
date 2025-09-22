"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LeaveBalance {
  id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}

interface LeaveBalanceCardProps {
  employeeId?: string;
}

export default function LeaveBalanceCard({
  employeeId,
}: LeaveBalanceCardProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalances();
    }
  }, [employeeId]);

  const fetchLeaveBalances = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("year", new Date().getFullYear())
        .order("leave_type");

      if (error) {
        console.error("Error fetching leave balances:", error);
      } else {
        setBalances(data || []);
      }
    } catch (error) {
      console.error("Error fetching leave balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
  };

  const getProgressColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return <div className="text-center py-4">Loading leave balances...</div>;
  }

  if (balances.length === 0) {
    return (
      <div className="ui-card p-6 text-center text-gray-500">
        <span className="text-4xl mb-4 block">⚖️</span>
        No leave balances found. Please contact HR to initialize your leave
        balances.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {balances.map((balance) => (
        <div key={balance.id} className="ui-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="ui-section-title text-base">
              {formatLeaveType(balance.leave_type)}
            </h3>
            <span className="text-2xl">
              {balance.leave_type === "vacation" && "🌴"}
              {balance.leave_type === "sick" && "🤒"}
              {balance.leave_type === "personal" && "👤"}
              {balance.leave_type === "emergency" && "🚨"}
              {balance.leave_type === "maternity" && "🤱"}
              {balance.leave_type === "paternity" && "👨‍👶"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Total:</span>
              <span className="font-medium">{balance.total_days} days</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Used:</span>
              <span className="font-medium">{balance.used_days} days</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Remaining:</span>
              <span className="font-medium" style={{ color: 'var(--success)' }}>
                {balance.remaining_days} days
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Usage</span>
                <span>
                  {balance.total_days > 0
                    ? Math.round((balance.used_days / balance.total_days) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'color-mix(in oklab, var(--foreground) 12%, transparent)' }}>
                <div
                  className={`h-2 rounded-full`}
                  style={{
                    backgroundColor: getProgressColor(
                      balance.used_days,
                      balance.total_days
                    ).replace('bg-','').replace('-500',''),
                    width:
                      balance.total_days > 0
                        ? `${(balance.used_days / balance.total_days) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
