import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Info, Monitor, Tablet, Smartphone, RotateCcw, ChevronDown } from 'lucide-react'

const DEVICE_FRAMES = {
  desktop: { width: 1120, height: 720, label: 'Desktop · 1120 × 720' },
  tablet:  { width: 768,  height: 1024, label: 'Tablet · 768 × 1024 (iPad)' },
  mobile:  { width: 390,  height: 844,  label: 'Mobile · 390 × 844 (iPhone 15 Pro)' },
}

const TIME_RANGES = ['All Time', 'Last 7 days', 'Last 30 days', 'This Month', 'This Quarter', 'This Year']
const GROUP_BYS   = ['Visit Date', 'Drive', 'Location', 'Outcome', 'Risk Level']

function StatusPill({ children, tone = 'info' }) {
  const map = {
    info: { bg: '#eef4ff', fg: '#1d4ed8', border: '#dbeafe' },
    note: { bg: '#fff7ed', fg: '#b45309', border: '#fed7aa' },
  }
  const c = map[tone] || map.info
  return (
    <div style={{
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '8px 10px', fontSize: 11.5, lineHeight: 1.4,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#475467',
      textTransform: 'none', letterSpacing: 0, marginBottom: 6,
    }}>{children}</div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', appearance: 'none', WebkitAppearance: 'none',
          padding: '8px 28px 8px 10px',
          border: '1px solid #e4e7ec', borderRadius: 8,
          background: '#fff', color: '#1d2939',
          fontSize: 12.5, cursor: 'pointer', outline: 'none',
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#667085' }} />
    </div>
  )
}

function DeviceToggle({ value, onChange }) {
  const items = [
    { key: 'desktop', icon: Monitor },
    { key: 'tablet',  icon: Tablet },
    { key: 'mobile',  icon: Smartphone },
  ]
  return (
    <div style={{
      display: 'inline-flex', padding: 3,
      background: '#f2f4f7', border: '1px solid #e4e7ec', borderRadius: 8,
    }}>
      {items.map(({ key, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={`${key.charAt(0).toUpperCase() + key.slice(1)} preview`}
            style={{
              border: 0, background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(16,24,40,0.08)' : 'none',
              borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
              color: active ? '#1d2939' : '#667085',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            <Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 0', fontSize: 12.5, color: '#344054', cursor: 'pointer',
    }}>
      <input
        type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#2563eb', width: 14, height: 14 }}
      />
      {label}
    </label>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#667085' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1d2939', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function getDateRangeBounds(timeRange) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (timeRange) {
    case 'Last 7 days': {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 6)
      return { start, end: now }
    }
    case 'Last 30 days': {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 29)
      return { start, end: now }
    }
    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    case 'This Quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), q * 3, 1)
      const end   = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59)
      return { start, end }
    }
    case 'This Year': {
      const start = new Date(now.getFullYear(), 0, 1)
      const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      return { start, end }
    }
    case 'All Time':
    default:
      return null
  }
}

function filterRowsByRange(rows, timeRange) {
  const bounds = getDateRangeBounds(timeRange)
  if (!bounds) return rows
  return rows.filter((r) => {
    const raw = r.dateISO || r.date
    if (!raw) return true
    const t = new Date(raw).getTime()
    if (Number.isNaN(t)) return true
    return t >= bounds.start.getTime() && t <= bounds.end.getTime()
  })
}

function deriveSummary(data, timeRange, groupBy) {
  const allRows = Array.isArray(data?.patientTableData) ? data.patientTableData : []
  const rows = filterRowsByRange(allRows, timeRange)
  const screened = rows.reduce((acc, r) => acc + (Number(r.screened) || 0), 0)
  const positive = rows.reduce((acc, r) => acc + (Number(r.positive) || 0), 0)
  const referred = rows.reduce((acc, r) => acc + (Number(r.referred) || 0), 0)
  const positiveRate = screened > 0 ? (positive / screened) * 100 : 0
  const locations = new Set(rows.map((r) => String(r.location || '').trim()).filter(Boolean)).size
  const totalDrives = rows.length

  const totalScreened = screened

  const groupKeyFor = (r) => {
    switch (groupBy) {
      case 'Drive':     return (r.camp || r.drive || r.driveName || 'Drive').toString()
      case 'Outcome':   return (r.outcome || r.result || 'Unknown').toString()
      case 'Risk Level':return (r.risk || r.riskLevel || 'Unknown').toString()
      case 'Visit Date':
      case 'Location':
      default:          return (r.location || 'Unknown').toString().split(',')[0].trim()
    }
  }
  const grouped = rows.reduce((acc, r) => {
    const k = groupKeyFor(r)
    acc[k] = (acc[k] || 0) + (Number(r.positive) || 0)
    return acc
  }, {})
  const topFindings = Object.entries(grouped)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return {
    totalDrives,
    totalScreened,
    positive,
    referred,
    positiveRate,
    locations,
    topFindings,
  }
}

export default function PreviewShell({
  responsiveMode,
  onResponsiveModeChange,
  data,
  children,
}) {
  const [timeRange, setTimeRange] = useState('All Time')
  const groupBy = 'Visit Date'

  const frame = DEVICE_FRAMES[responsiveMode] || DEVICE_FRAMES.mobile
  const summary = useMemo(() => deriveSummary(data, timeRange, groupBy), [data, timeRange, groupBy])

  // Auto-fit the device frame inside the available stage area.
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    if (!stageRef.current) return undefined
    const el = stageRef.current
    const update = () => setStageSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const horizontalSlack = 32
  const verticalSlack   = 80

  // Bezel thickness around the device screen.
  const bezel = responsiveMode === 'mobile'
    ? { x: 14, top: 16, bottom: 16 }
    : responsiveMode === 'tablet'
      ? { x: 24, top: 24, bottom: 24 }
      : { x: 14, top: 14, bottom: 22 }

  const outerW = frame.width  + bezel.x * 2
  const outerH = frame.height + bezel.top + bezel.bottom

  const scale = useMemo(() => {
    if (!stageSize.w || !stageSize.h) return 1
    const sx = (stageSize.w - horizontalSlack) / outerW
    const sy = (stageSize.h - verticalSlack)   / outerH
    return Math.min(1, sx, sy)
  }, [stageSize.w, stageSize.h, outerW, outerH])

  const resetPreview = () => {
    setTimeRange('All Time')
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US')

  return (
    <div className="preview-shell">
      {/* Left rail */}
      <aside className="preview-rail preview-rail--left">
        <div className="preview-rail__title">Preview Options</div>

        <div className="preview-field">
          <FieldLabel>Preview As</FieldLabel>
          <Select value="Field User (Health Worker)" onChange={() => {}} options={['Field User (Health Worker)', 'Clinician', 'Administrator']} />
        </div>

        <div className="preview-field">
          <FieldLabel>Device View</FieldLabel>
          <DeviceToggle value={responsiveMode} onChange={onResponsiveModeChange} />
        </div>

        <div className="preview-field">
          <FieldLabel>Time Range</FieldLabel>
          <Select value={timeRange} onChange={setTimeRange} options={TIME_RANGES} />
        </div>

        <button onClick={resetPreview} className="preview-reset-btn">
          <RotateCcw size={13} /> Reset Preview
        </button>
      </aside>

      {/* Center stage */}
      <main className="preview-stage" ref={stageRef}>
        <div className="preview-stage__hint">
          <StatusPill tone="info">
            This is a preview of how the dashboard will appear to end-users.
          </StatusPill>
          <div className="preview-stage__device-label">
            {frame.label}{scale < 1 ? ` · ${Math.round(scale * 100)}% fit` : ''}
          </div>
        </div>

        <div
          className="preview-stage__frame-slot"
          style={{ width: outerW * scale, height: outerH * scale }}
        >
          <div
            className={`device-frame device-frame--${responsiveMode}`}
            style={{
              width: outerW,
              height: outerH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              paddingLeft: bezel.x,
              paddingRight: bezel.x,
              paddingTop: bezel.top,
              paddingBottom: bezel.bottom,
              boxSizing: 'border-box',
            }}
          >
            {responsiveMode === 'mobile' && null}
            <div
              className="device-frame__screen"
              style={{ width: frame.width, height: frame.height }}
            >
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Right rail */}
      <aside className="preview-rail preview-rail--right">
        <div className="preview-rail__title">Summary (Read-only)</div>

        <StatusPill tone="info">
          Summary updates as users interact with filters above.
        </StatusPill>

        <div className="preview-summary__group">
          <SummaryRow label="Time Range" value={timeRange} />
          <SummaryRow label="Total Drives" value={fmt(summary.totalDrives)} />
          <SummaryRow label="Total Screened" value={fmt(summary.totalScreened)} />
          <SummaryRow label="Positive Findings" value={fmt(summary.positive)} />
          <SummaryRow label="Referred" value={fmt(summary.referred)} />
          <SummaryRow label="Positive Rate" value={`${summary.positiveRate.toFixed(1)}%`} />
          <SummaryRow label="Active Locations" value={fmt(summary.locations)} />
        </div>

        {summary.topFindings.length > 0 && (
          <div className="preview-summary__group">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475467', marginBottom: 4 }}>
              Top Findings by {groupBy === 'Visit Date' ? 'Location' : groupBy}
            </div>
            {summary.topFindings.map(([loc, count]) => (
              <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#344054', padding: '3px 0' }}>
                <span>{loc}</span>
                <span style={{ fontWeight: 600 }}>{fmt(count)}</span>
              </div>
            ))}
          </div>
        )}

        <StatusPill tone="note">
          Data shown in preview is sample data. Actual patient data will not be displayed after publishing.
        </StatusPill>
      </aside>
    </div>
  )
}
