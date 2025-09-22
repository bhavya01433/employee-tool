"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  department?: string;
  position?: string;
  user_role: "admin" | "employee";
  is_active: boolean;
  hire_date?: string;
}

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        setEmployees(data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (
    employeeId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", employeeId);

      if (!error) {
        fetchEmployees();
      }
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.department &&
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-4">Loading employees...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ui-input"
        />
      </div>

      <div className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium">
                        {employee.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.employee_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {employee.department || "Not assigned"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.position || "Not assigned"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{
                        backgroundColor: "color-mix(in oklab, var(--foreground) 10%, transparent)",
                        color: "var(--foreground)",
                      }}
                    >{employee.user_role.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{
                        backgroundColor: employee.is_active
                          ? "color-mix(in oklab, var(--success) 20%, transparent)"
                          : "color-mix(in oklab, var(--danger) 20%, transparent)",
                        color: employee.is_active ? "var(--success)" : "var(--danger)",
                      }}
                    >{employee.is_active ? "ACTIVE" : "INACTIVE"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        toggleEmployeeStatus(employee.id, employee.is_active)
                      }
                      className="mr-2 ui-btn ui-btn-secondary"
                    >
                      {employee.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="ui-btn ui-btn-secondary">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
