import { useState, useEffect, JSX } from 'react'
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

declare global {
  interface Window {
    Razorpay: any
  }

  interface ImportMeta {
    readonly env: {
      VITE_RAZORPAY_KEY_ID: string
    }
  }
}

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

  useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  document.body.appendChild(script)

  return () => {
    document.body.removeChild(script)
  }
}, [])

 
const fetchData = async () => {
  try {
    setIsLoading(true)

    // Load plans first so UI appears immediately
    const plansRes = await api.get('/payments/plans').catch(() => null)
    if (plansRes?.data?.data?.plans) setPlans(plansRes.data.data.plans)
    setIsLoading(false) // ← unblock UI early, cards appear now

    // Load rest in background
    const [subRes, paymentsRes] = await Promise.all([
      api.get('/payments/subscription').catch(() => null),
      api.get('/payments/history').catch(() => null)
    ])
    if (subRes?.data?.data?.subscription) setSubscription(subRes.data.data.subscription)
    if (paymentsRes?.data?.data?.payments) setPayments(paymentsRes.data.data.payments)

  } catch (err: any) {
    console.error('Full error:', err.response)
    toast.error(err.response?.data?.message || 'Failed to load plans')
    setIsLoading(false) // ← make sure to unblock on error too
  }
}


  const handleSubscribe = async (plan: Plan) => {
    if (!window.Razorpay) {
    toast.error('Payment gateway not ready. Please refresh.')
    return
  }
    setProcessingPlan(plan.id)
    try {
      const res = await api.post('/payments/create-order', { plan: plan.id })
      const { orderId, amount, currency } = res.data.data.order

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'OmniWork',
        description: `${plan.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            toast.success(`Successfully subscribed to ${plan.name} plan!`)
            fetchData()
          } catch {
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: 'OmniWork User',
          email: 'user@omniwork.com'
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' })
            setProcessingPlan(null)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order')
      setProcessingPlan(null)
    }
  }

  const planIcons: Record<string, JSX.Element> = {
    BASIC:      <Zap size={20} className="text-blue-500" />,
    PRO:        <Star size={20} className="text-brand-500" />,
    ENTERPRISE: <Crown size={20} className="text-yellow-500" />,
  }

  const planColors: Record<string, string> = {
    BASIC:      'hover:border-blue-500/60',
    PRO:        'border-brand-500/50 hover:border-brand-500',
    ENTERPRISE: 'hover:border-yellow-500/60',
  }

  const planBadge: Record<string, string | null> = {
    BASIC:      null,
    PRO:        'Most Popular',
    ENTERPRISE: 'Best Value',
  }

  // Instead of showing nothing while loading, show skeleton cards
if (isLoading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1,2,3].map(i => (
        <div key={i} className="card animate-pulse h-64 bg-surface-muted" />
      ))}
    </div>
  )
}

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="page-title">Subscription Plans</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          Choose the plan that fits your team. All plans include core features with no hidden fees.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <Shield size={12} className="text-yellow-500" />
          <span className="text-yellow-500 text-xs font-medium">Test mode — use Razorpay test cards</span>
        </div>
      </div>

      {/* Active subscription */}
      {subscription && (
        <div className="card border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Active Subscription
                  </h3>
                  <span className="badge badge-green">{subscription.plan}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
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
            <span className="badge badge-green text-sm px-4 py-2">{subscription.status}</span>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`
              card relative flex flex-col transition-all duration-200 border-2
              ${planColors[plan.id] || ''}
              ${subscription?.plan === plan.id ? 'ring-2 ring-green-500/30' : ''}
            `}
          >
            {planBadge[plan.id] && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                  {planBadge[plan.id]}
                </span>
              </div>
            )}

            {subscription?.plan === plan.id && (
              <div className="absolute -top-3 right-4">
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  Current Plan
                </span>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                  {planIcons[plan.id]}
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{plan.duration} days</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ month</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-brand-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-brand-500" />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={!!processingPlan || subscription?.plan === plan.id}
              className={`
                w-full py-3 rounded-xl font-medium text-sm transition-all duration-150
                flex items-center justify-center gap-2
                ${subscription?.plan === plan.id
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                  : plan.id === 'PRO'
                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                    : 'border text-sm font-medium hover:bg-[var(--surface-hover)]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={
                plan.id !== 'PRO' && subscription?.plan !== plan.id
                  ? { borderColor: 'var(--surface-border)', color: 'var(--text-secondary)' }
                  : {}
              }
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

      {/* Test card info */}
      <div className="card border-brand-500/20 bg-brand-500/5">
        <div className="flex items-start gap-3">
          <CreditCard size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Test Payment Details
            </p>
            <div className="mt-2 space-y-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <p>Card Number: 4111 1111 1111 1111</p>
              <p>Expiry: Any future date e.g. 12/26</p>
              <p>CVV: Any 3 digits e.g. 123</p>
              <p>OTP: Select Success when prompted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Payment History</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All your transactions</p>
            </div>
            <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--surface-border)' }}>
                  <th className="table-header">Date</th>
                  <th className="table-header">Plan</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Transaction ID</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr
                    key={payment.id}
                    className="transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="table-cell">{formatDate(payment.createdAt)}</td>
                    <td className="table-cell">
                      <span className="badge badge-purple">{payment.plan}</span>
                    </td>
                    <td className="table-cell font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
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

      {/* Note */}
      <div className="card border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-500">Payment Gateway in Test Mode</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Razorpay is configured in sandbox mode. No real money will be charged.
              Add your Razorpay live keys to enable real payments in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}