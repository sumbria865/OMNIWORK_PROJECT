import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import {
  Calendar,
  Plus,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Leave {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
  remarks: string | null
  createdAt: string
}

interface LeaveBalance {
  [key: string]: {
    allocated: number
    used: number
    remaining: number
  }
}

const statusColors: Record<string, string> = {
  PENDING:   'badge-yellow',
  APPROVED:  'badge-green',
  REJECTED:  'badge-red',
  CANCELLED: 'badge-gray',
}

const statusIcons: Record<string, JSX.Element> = {
  PENDING:   <Clock size={12} />,
  APPROVED:  <CheckCircle size={12} />,
  REJECTED:  <XCircle size={12} />,
  CANCELLED: <AlertCircle size={12} />,
}

const leaveTypeColors: Record<string, string> = {
  CASUAL:    'badge-blue',
  SICK:      'badge-red',
  EARNED:    'badge-green',
  MATERNITY: 'badge-purple',
  PATERNITY: 'badge-purple',
  UNPAID:    'badge-gray',
}

export default function LeaveRequest() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/leaves/me').catch(() => null),
        api.get('/leaves/balance').catch(() => null)
      ])
      if (leavesRes?.data?.data?.leaves) setLeaves(leavesRes.data.data.leaves)
      if (balanceRes?.data?.data?.balance) setBalance(balanceRes.data.data.balance)
    } catch {
      toast.error('Failed to fetch leave data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/leaves', form)
      toast.success('Leave request submitted successfully')
      setShowModal(false)
      setForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (leaveId: string) => {
    try {
      await api.patch(`/leaves/${leaveId}/cancel`)
      toast.success('Leave request cancelled')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Leave Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your leave requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Request Leave
        </button>
      </div>

      {/* Leave balance */}
      {balance && (
        <div className="card">
          <h3 className="section-title mb-4">Leave Balance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(balance).map(([type, data]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs capitalize">
                    {type.toLowerCase()}
                  </span>
                  <span className="text-gray-300 text-xs font-medium">
                    {data.remaining}/{data.allocated}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{
                      width: data.allocated > 0
                        ? `${(data.remaining / data.allocated) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <p className="text-gray-600 text-xs">{data.used} used</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">My Leave Requests</h3>
          <Calendar size={16} className="text-gray-600" />
        </div>

        {leaves.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No leave requests yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 mx-auto"
            >
              <Plus size={16} />
              Request Leave
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-4 bg-surface-hover border border-surface-border rounded-xl hover:border-surface-muted transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-brand-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${leaveTypeColors[leave.leaveType]}`}>
                        {leave.leaveType}
                      </span>
                      <span className="text-gray-300 text-sm font-medium">
                        {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    </p>
                    <p className="text-gray-600 text-xs line-clamp-1">{leave.reason}</p>
                    {leave.remarks && (
                      <p className="text-gray-600 text-xs italic">
                        Remarks: {leave.remarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`badge ${statusColors[leave.status]} flex items-center gap-1`}>
                    {statusIcons[leave.status]}
                    {leave.status}
                  </span>
                  {leave.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(leave.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancel request"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h3 className="text-gray-100 font-semibold">Request Leave</h3>
                <p className="text-gray-600 text-xs mt-1">Submit a new leave request</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="label">Leave type</label>
                <select
                  value={form.leaveType}
                  onChange={e => setForm({ ...form, leaveType: e.target.value })}
                  className="input-field"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    required
                    className="input-field"
                    min={form.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly explain the reason for leave (min 10 characters)"
                  required
                  rows={3}
                  className="input-field resize-none"
                  minLength={10}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 justify-center"
                >
                  {submitting
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Plus size={16} />
                  }
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}