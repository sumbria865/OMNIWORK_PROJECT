import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import {
  Receipt,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Upload,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/helpers'

interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  receiptUrl: string | null
  status: string
  remarks: string | null
  createdAt: string
}

interface ExpenseSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  reimbursed: number
  totalAmount: number
  approvedAmount: number
}

const statusColors: Record<string, string> = {
  PENDING:    'badge-yellow',
  APPROVED:   'badge-green',
  REJECTED:   'badge-red',
  REIMBURSED: 'badge-blue',
}

const categoryColors: Record<string, string> = {
  TRAVEL:        'badge-blue',
  FOOD:          'badge-green',
  ACCOMMODATION: 'badge-purple',
  EQUIPMENT:     'badge-yellow',
  SOFTWARE:      'badge-red',
  TRAINING:      'badge-gray',
  OTHER:         'badge-gray',
}

export default function ExpenseForm() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'TRAVEL',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [expensesRes, summaryRes] = await Promise.all([
        api.get('/expenses/me').catch(() => null),
        api.get('/expenses/summary').catch(() => null)
      ])
      if (expensesRes?.data?.data?.expenses) setExpenses(expensesRes.data.data.expenses)
      if (summaryRes?.data?.data?.summary) setSummary(summaryRes.data.data.summary)
    } catch {
      toast.error('Failed to fetch expense data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/expenses', {
        title: form.title,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        category: form.category
      })
      toast.success('Expense submitted successfully')
      setShowModal(false)
      setForm({ title: '', description: '', amount: '', category: 'TRAVEL' })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}`)
      toast.success('Expense deleted')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Expenses</h2>
          <p className="text-gray-500 text-sm mt-1">Submit and track expense reimbursements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} />
          New Expense
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Submitted', value: summary.total,    color: 'text-gray-300',  bg: 'bg-surface-muted' },
            { label: 'Pending',         value: summary.pending,  color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Approved',        value: summary.approved, color: 'text-green-400',  bg: 'bg-green-500/10' },
            { label: 'Rejected',        value: summary.rejected, color: 'text-red-400',    bg: 'bg-red-500/10' },
          ].map((item, i) => (
            <div key={i} className="card space-y-2">
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center`}>
                <Receipt size={14} className={item.color} />
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-gray-600 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl">
              <DollarSign size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Total Submitted</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Approved Amount</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {formatCurrency(summary.approvedAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">My Expenses</h3>
          <Receipt size={16} className="text-gray-600" />
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No expenses submitted yet</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
              <Plus size={16} />
              Submit Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-surface-hover border border-surface-border rounded-xl hover:border-surface-muted transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt size={16} className="text-brand-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-200 text-sm font-medium">{expense.title}</p>
                      <span className={`badge ${categoryColors[expense.category]}`}>
                        {expense.category}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-gray-500 text-xs line-clamp-1">{expense.description}</p>
                    )}
                    <p className="text-gray-600 text-xs">{formatDate(expense.createdAt)}</p>
                    {expense.remarks && (
                      <p className="text-gray-600 text-xs italic">Remarks: {expense.remarks}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-gray-100 font-semibold text-sm">
                    {formatCurrency(expense.amount)}
                  </span>
                  <span className={`badge ${statusColors[expense.status]}`}>
                    {expense.status}
                  </span>
                 {expense.receiptUrl && (
  <button
    onClick={() => window.open(expense.receiptUrl!, '_blank')}
    className="p-1.5 text-gray-600 hover:text-brand-400 rounded-lg transition-colors"
    title="View receipt"
  >
    <Upload size={14} />
  </button>
)}

                  {expense.status === 'PENDING' && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete expense"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h3 className="text-gray-100 font-semibold">Submit Expense</h3>
                <p className="text-gray-600 text-xs mt-1">Add a new expense reimbursement request</p>
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
                <label className="label">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Flight to Delhi"
                  required
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Amount (INR)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    min="1"
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="TRAVEL">Travel</option>
                    <option value="FOOD">Food</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="TRAINING">Training</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details about the expense"
                  rows={2}
                  className="input-field resize-none"
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
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}