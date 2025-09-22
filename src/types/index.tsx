export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  employee_id: string;
  department?: string;
  position?: string;
  hire_date?: string;
  salary?: number;
  user_role: "admin" | "employee";
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type:
    | "vacation"
    | "sick"
    | "personal"
    | "emergency"
    | "maternity"
    | "paternity";
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: Profile;
  approver?: Profile;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type:
    | "vacation"
    | "sick"
    | "personal"
    | "emergency"
    | "maternity"
    | "paternity";
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "leave_request" | "leave_approved" | "leave_rejected" | "general";
  is_read: boolean;
  related_id?: string;
  created_at: string;
}
