"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

interface LeaveRequest {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
}

interface MyLeaveRequestsProps {
  limit?: number
}

export default function MyLeaveRequests({ limit }: MyLeaveRequestsProps) {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyRequests()
  }, [profile])

  const fetchMyRequests = async () => {
    if (!profile) return

    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', profile.id)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching leave requests:', error)
      } else {
        setRequests(data || [])
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  if (loading) {
    return <div className="text-center py-4">Loading leave requests...</div>
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-4 block">📝</span>
        No leave requests found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="ui-card p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="ui-section-title text-base">
                {formatLeaveType(request.leave_type)}
              </h3>
              <p className="text-sm text-[var(--muted)]">
                {new Date(request.start_date).toLocaleDateString()} -{' '}
                {new Date(request.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Duration:</span>
              <span className="font-medium">{request.total_days} days</span>
            </div>

            <div>
              <span className="text-sm text-[var(--muted)]">Reason:</span>
              <p className="text-sm mt-1">{request.reason}</p>
            </div>

            {request.status === 'rejected' && request.rejection_reason && (
              <div className="mt-3 p-3 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in oklab, var(--danger) 10%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)'
                }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                  Rejection Reason:
                </span>
                <p className="text-sm mt-1" style={{ color: 'color-mix(in oklab, var(--danger) 80%, var(--foreground))' }}>
                  {request.rejection_reason}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-3">
              Submitted on {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
