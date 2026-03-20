import { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/helpers'
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Star,
  Loader2,
  Crown,
  Calendar,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  duration: number
  features: string[]
}

interface Subscription {
  id: string
  plan: string
  status: string
  startDate: string
  endDate: string
}

interface Payment {
  id: string
  amount: number
  status: string
  plan: string
  createdAt: string
  razorpayPaymentId: string | null
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [plansRes, subRes, paymentsRes] = await Promise.all([
        api.get('/payments/plans').catch(() => null),
        api.get('/payments/subscription').catch(() => null),
        api.get('/payments/history').catch(() => null)
      ])
      if (plansRes?.data?.data?.plans) setPlans(plansRes.data.data.plans)
      if (subRes?.data?.data?.subscription) setSubscription(subRes.data.data.subscription)
      if (paymentsRes?.data?.data?.payments) setPayments(paymentsRes.data.data.payments)
    } catch {
      toast.error('Failed to fetch plans')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    setProcessingPlan(plan.id)
    try {
      const res = await api.post('/payments/create-order', { plan: plan.id })
      const { orderId, amount, currency } = res.data.data.order

      toast.success(
        `Order created for ${plan.name} plan. Add Razorpay keys to complete payment.`,
        { duration: 5000 }
      )

      console.log('Razorpay order created:', { orderId, amount, currency })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally {
      setProcessingPlan(null)
    }
  }

  const planIcons: Record<string, JSX.Element> = {
    BASIC:      <Zap size={20} className="text-blue-400" />,
    PRO:        <Star size={20} className="text-brand-400" />,
    ENTERPRISE: <Crown size={20} className="text-yellow-400" />,
  }

  const planColors: Record<string, string> = {
    BASIC:      'border-blue-500/30 hover:border-blue-500/60',
    PRO:        'border-brand-500/50 hover:border-brand-500 bg-brand-500/5',
    ENTERPRISE: 'border-yellow-500/30 hover:border-yellow-500/60',
  }

  const planBadge: Record<string, string | null> = {
    BASIC:      null,
    PRO:        'Most Popular',
    ENTERPRISE: 'Best Value',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="page-title">Subscription Plans</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Choose the plan that fits your team. All plans include core features with no hidden fees.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <Shield size={12} className="text-yellow-400" />
          <span className="text-yellow-400 text-xs font-medium">Test mode — no real payments processed</span>
        </div>
      </div>

      {/* Active subscription */}
      {subscription && (
        <div className="card border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-100 font-semibold">Active Subscription</h3>
                  <span className="badge badge-green">{subscription.plan}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Started: {formatDate(subscription.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Expires: {formatDate(subscription.endDate)}
                  </span>
                </div>
              </div>
            </div>
            <span className="badge badge-green text-sm px-4 py-2">
              {subscription.status}
            </span>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`
              card relative flex flex-col transition-all duration-200
              ${planColors[plan.id] || 'border-surface-border'}
              ${subscription?.plan === plan.id ? 'ring-2 ring-green-500/30' : ''}
            `}
          >
            {/* Popular badge */}
            {planBadge[plan.id] && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                  {planBadge[plan.id]}
                </span>
              </div>
            )}

            {/* Current plan badge */}
            {subscription?.plan === plan.id && (
              <div className="absolute -top-3 right-4">
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  Current Plan
                </span>
              </div>
            )}

            {/* Plan header */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-surface-muted rounded-xl">
                  {planIcons[plan.id]}
                </div>
                <div>
                  <h3 className="text-gray-100 font-bold text-lg">{plan.name}</h3>
                  <p className="text-gray-600 text-xs">{plan.duration} days</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-gray-600 text-sm">/ month</span>
              </div>
            </div>

            {/* Features */}
            <div className="flex-1 space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-brand-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-brand-400" />
                  </div>
                  <span className="text-gray-400 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={!!processingPlan || subscription?.plan === plan.id}
              className={`
                w-full py-3 rounded-xl font-medium text-sm transition-all duration-150
                flex items-center justify-center gap-2
                ${subscription?.plan === plan.id
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
                  : plan.id === 'PRO'
                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                    : 'bg-surface-hover hover:bg-surface-muted text-gray-300 border border-surface-border hover:border-surface-muted'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {processingPlan === plan.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : subscription?.plan === plan.id ? (
                <>
                  <CheckCircle size={16} />
                  Current Plan
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Subscribe to {plan.name}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Payment History</h3>
              <p className="text-gray-600 text-xs mt-1">All your transactions</p>
            </div>
            <CreditCard size={16} className="text-gray-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="table-header">Date</th>
                  <th className="table-header">Plan</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Transaction ID</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-surface-hover transition-colors">
                    <td className="table-cell">{formatDate(payment.createdAt)}</td>
                    <td className="table-cell">
                      <span className="badge badge-purple">{payment.plan}</span>
                    </td>
                    <td className="table-cell font-medium text-gray-200">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="table-cell text-gray-600 font-mono text-xs">
                      {payment.razorpayPaymentId || '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        payment.status === 'SUCCESS' ? 'badge-green' :
                        payment.status === 'PENDING' ? 'badge-yellow' :
                        payment.status === 'FAILED' ? 'badge-red' : 'badge-gray'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note about test mode */}
      <div className="card border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-medium">Payment Gateway in Test Mode</p>
            <p className="text-gray-500 text-xs mt-1">
              Razorpay is currently configured in sandbox mode. No real money will be charged.
              Add your Razorpay live keys to enable real payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}