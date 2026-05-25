import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  label: string
  value: string
  icon: LucideIcon
  color?: 'accent' | 'danger' | 'warning' | 'success'
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

const COLOR_MAP = {
  accent: { text: 'text-mirage-accent', bg: 'bg-mirage-accent/10', border: 'border-mirage-accent/20' },
  danger: { text: 'text-mirage-danger', bg: 'bg-mirage-danger/10', border: 'border-mirage-danger/20' },
  warning: { text: 'text-mirage-warning', bg: 'bg-mirage-warning/10', border: 'border-mirage-warning/20' },
  success: { text: 'text-mirage-success', bg: 'bg-mirage-success/10', border: 'border-mirage-success/20' },
}

export default function StatCard({ label, value, icon: Icon, color = 'accent', trend, subtitle }: Props) {
  const c = COLOR_MAP[color]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('card p-4 relative overflow-hidden', c.border, 'border')}
    >
      {/* Background shimmer */}
      <div className={clsx('absolute inset-0 opacity-5', c.bg)} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', c.bg)}>
            <Icon className={clsx('w-4 h-4', c.text)} />
          </div>
          {trend && (
            <TrendIcon className={clsx('w-4 h-4', {
              'text-mirage-danger': trend === 'up' && color !== 'success',
              'text-mirage-success': trend === 'down' || (trend === 'up' && color === 'success'),
              'text-mirage-muted': trend === 'neutral',
            })} />
          )}
        </div>
        <p className={clsx('text-2xl font-display font-bold', c.text)}>{value}</p>
        <p className="text-xs text-mirage-muted font-mono mt-1 uppercase tracking-wider">{label}</p>
        {subtitle && <p className="text-xs text-mirage-muted mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )
}
