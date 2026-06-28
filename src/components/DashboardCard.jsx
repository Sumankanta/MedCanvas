import { useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { CARD_ICON_LIBRARY, getCardIcon } from '@/lib/cardIcons'
import { useCountUp } from '@/hooks/useCountUp'

/**
 * Reusable, props-driven dashboard card.
 *
 * Variants:
 *  - "kpi"      : large number + trend + icon            (default)
 *  - "stat"     : compact stat with no trend
 *  - "progress" : value + progress bar towards a target
 *  - "trend"    : emphasis on the trend indicator
 *
 * Props:
 *  - variant       string
 *  - title         string
 *  - value         number (animated)
 *  - dateLabel     string (editable subtitle)
 *  - trend         number (positive => up, negative => down)
 *  - trendFormat   "percentage" | "value" | "both"
 *  - iconKey       string key from CARD_ICON_LIBRARY
 *  - color         primary accent color (hex)
 *  - iconColor     icon color (defaults to color)
 *  - target        number — used by progress variant to compute %
 *  - numberFormat  "comma" | "plain" | "decimal" | "compact" | "currency"
 *  - suffix        string
 *  - editable      boolean — show inline edit affordances
 *  - onChange      (patch) => void  — receives partial updates from inline edits
 *  - theme         "light" | "dark"
 */
export default function DashboardCard({
  variant = 'kpi',
  title = 'KPI Card',
  value = 0,
  dateLabel = 'vs Apr 1 - Apr 30, 2025',
  trend = 0,
  trendFormat = 'percentage',
  iconKey = 'users',
  color = '#3b82f6',
  iconColor,
  target = 0,
  numberFormat = 'comma',
  suffix = '',
  editable = false,
  onChange,
  theme = 'light',
  className = '',
  style,
}) {
  const Icon = getCardIcon(iconKey)
  const isDark = theme === 'dark'
  const animatedValue = useCountUp(value)

  const formattedValue = useMemo(
    () => formatNumber(animatedValue, numberFormat, suffix),
    [animatedValue, numberFormat, suffix],
  )

  const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus
  const trendColor = trendDir === 'up' ? '#16a34a' : trendDir === 'down' ? '#dc2626' : '#64748b'
  const trendText = formatTrend(trend, trendFormat)

  const showTrend = variant !== 'stat'
  const showProgress = variant === 'progress' && Number(target) > 0
  const progressPct = showProgress
    ? Math.max(0, Math.min(100, (Number(value) / Number(target)) * 100))
    : 0

  return (
    <div
      className={`dashcard dashcard--${variant}${isDark ? ' dashcard--dark' : ''} ${className}`}
      style={{ '--dc-accent': color, '--dc-icon': iconColor || color, ...style }}
    >
      <div className="dashcard__row">
        <div className="dashcard__main">
          <EditableText
            value={title}
            editable={editable}
            onCommit={(v) => onChange?.({ title: v })}
            className="dashcard__title"
          />

          <div key={String(value)} className="dashcard__value">
            {formattedValue}
          </div>

          <EditableText
            value={dateLabel}
            editable={editable}
            onCommit={(v) => onChange?.({ dateLabel: v })}
            className="dashcard__sub"
          />
        </div>

        <div className="dashcard__side">
          <div className="dashcard__icon-wrap" aria-hidden="true">
            <Icon size={22} strokeWidth={2.1} />
          </div>

          {showTrend && (
            <div
              className={`dashcard__trend dashcard__trend--${trendDir}`}
              style={{ color: trendColor }}
            >
              <span>{trendText}</span>
              <TrendIcon size={14} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      {showProgress && (
        <div className="dashcard__progress">
          <div className="dashcard__progress-track">
            <div
              className="dashcard__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="dashcard__progress-meta">
            <span>{progressPct.toFixed(1)}%</span>
            <span>
              of {formatNumber(Number(target) || 0, numberFormat, suffix)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// --- helpers --------------------------------------------------------------

function formatNumber(value, format = 'comma', suffix = '') {
  const num = Number(value) || 0
  let out
  switch (format) {
    case 'plain':
      out = String(Math.round(num))
      break
    case 'decimal':
      out = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(num)
      break
    case 'compact':
      out = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(num)
      break
    case 'currency':
      out = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(num)
      break
    case 'comma':
    default:
      out = new Intl.NumberFormat('en-US').format(Math.round(num))
      break
  }
  return suffix ? `${out} ${suffix}` : out
}

function formatTrend(trend, format = 'percentage') {
  const arrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '•'
  const mag = Math.abs(Number(trend) || 0)
  if (format === 'value') return `${arrow} ${mag.toLocaleString('en-US')}`
  return `${arrow} ${mag.toFixed(1)}%`
}

function EditableText({ value, editable, onCommit, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editable) return <span className={className}>{value}</span>

  if (!editing) {
    return (
      <button
        type="button"
        className={`${className} dashcard__editable`}
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        title="Click to edit"
      >
        <span>{value}</span>
        <Pencil size={11} className="dashcard__editable-icon" />
      </button>
    )
  }

  const commit = () => {
    setEditing(false)
    if (draft !== value) onCommit?.(draft)
  }
  const cancel = () => {
    setEditing(false)
    setDraft(value)
  }

  return (
    <span className={`${className} dashcard__editing`}>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        onBlur={commit}
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commit}>
        <Check size={12} />
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancel}>
        <X size={12} />
      </button>
    </span>
  )
}

// Re-export icon library so consumers can build pickers.
export { CARD_ICON_LIBRARY }
