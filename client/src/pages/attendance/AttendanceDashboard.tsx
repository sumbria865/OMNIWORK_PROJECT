import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatTime, formatDate, getWorkHours, getCurrentMonth, getCurrentYear } from '../../utils/formatDate'
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, TrendingUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  workHours: number | null
}

interface AttendanceSummary {
  present: number
  absent: number
  late: number
  halfDay: number
  onLeave: number
  totalWorkHours: string
  totalDays: number
}

interface TodayStatus {
  attendance: AttendanceRecord | null
  isCheckedIn: boolean
  isCheckedOut: boolean
}

const statusColors: Record<string, string> = {
  PRESENT:  'badge-green',
  ABSENT:   'badge-red',
  LATE:     'badge-yellow',
  HALF_DAY: 'badge-yellow',
  ON_LEAVE: 'badge-blue',
  HOLIDAY:  'badge-purple',
}

export default function AttendanceDashboard() {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [todayRes, summaryRes, recordsRes] = await Promise.all([
        api.get('/attendance/today').catch(() => null),
        api.get(`/attendance/me/summary?month=${getCurrentMonth()}&year=${getCurrentYear()}`).catch(() => null),
        api.get('/attendance/me?limit=10').catch(() => null)
      ])
      if (todayRes?.data?.data) setTodayStatus(todayRes.data.data)
      if (summaryRes?.data?.data?.summary) setSummary(summaryRes.data.data.summary)
      if (recordsRes?.data?.data?.records) setRecords(recordsRes.data.data.records)
    } catch {
      toast.error('Failed to fetch attendance data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await api.post('/attendance/checkin')
      toast.success('Checked in successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await api.post('/attendance/checkout')
      toast.success('Checked out successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check out')
    } finally {
      setActionLoading(false)
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
      <div>
        <h2 className="page-title">Attendance</h2>
        <p className="text-gray-500 text-sm mt-1">Track your daily attendance</p>
      </div>

      {/* Today's status card */}
      <div className="card bg-gradient-to-br from-brand-500/10 to-purple-500/5 border-brand-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              <span className="text-gray-400 text-sm font-medium">Today</span>
              <span className="text-gray-600 text-xs">
                {formatDate(new Date().toISOString())}
              </span>
            </div>

            <div className="text-4xl font-bold text-white font-mono tracking-tight">
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {todayStatus?.attendance?.checkIn && (
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle size={14} />
                  <span>In: {formatTime(todayStatus.attendance.checkIn)}</span>
                </div>
              )}
              {todayStatus?.attendance?.checkOut && (
                <div className="flex items-center gap-1.5 text-blue-400">
                  <CheckCircle size={14} />
                  <span>Out: {formatTime(todayStatus.attendance.checkOut)}</span>
                </div>
              )}
              {todayStatus?.attendance?.checkIn && todayStatus?.attendance?.checkOut && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={14} />
                  <span>{getWorkHours(
                    todayStatus.attendance.checkIn,
                    todayStatus.attendance.checkOut
                  )}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {!todayStatus?.isCheckedIn && !todayStatus?.isCheckedOut && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="btn-primary px-8 py-3"
              >
                {actionLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <CheckCircle size={16} />
                }
                Check In
              </button>
            )}
            {todayStatus?.isCheckedIn && !todayStatus?.isCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="btn-danger px-8 py-3"
              >
                {actionLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <XCircle size={16} />
                }
                Check Out
              </button>
            )}
            {todayStatus?.isCheckedOut && (
              <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Day Complete</span>
              </div>
            )}
            {todayStatus?.attendance && (
              <span className={`badge ${statusColors[todayStatus.attendance.status]} self-center`}>
                {todayStatus.attendance.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Present',    value: summary.present,        color: 'text-green-400',  bg: 'bg-green-500/10' },
            { label: 'Absent',     value: summary.absent,         color: 'text-red-400',    bg: 'bg-red-500/10' },
            { label: 'Late',       value: summary.late,           color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Half Day',   value: summary.halfDay,        color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'On Leave',   value: summary.onLeave,        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
            { label: 'Work Hours', value: summary.totalWorkHours, color: 'text-brand-400',  bg: 'bg-brand-500/10' },
          ].map((item, i) => (
            <div key={i} className="card text-center space-y-2">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mx-auto`}>
                <TrendingUp size={16} className={item.color} />
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-gray-600 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance history */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Recent Attendance</h3>
            <p className="text-gray-600 text-xs mt-1">Last 10 records</p>
          </div>
          <Calendar size={16} className="text-gray-600" />
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="table-header">Date</th>
                  <th className="table-header">Check In</th>
                  <th className="table-header">Check Out</th>
                  <th className="table-header">Work Hours</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className="hover:bg-surface-hover transition-colors">
                    <td className="table-cell">{formatDate(record.date)}</td>
                    <td className="table-cell">
                      {record.checkIn ? formatTime(record.checkIn) : '—'}
                    </td>
                    <td className="table-cell">
                      {record.checkOut ? formatTime(record.checkOut) : '—'}
                    </td>
                    <td className="table-cell">
                      {record.checkIn && record.checkOut
                        ? getWorkHours(record.checkIn, record.checkOut)
                        : '—'
                      }
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusColors[record.status]}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}