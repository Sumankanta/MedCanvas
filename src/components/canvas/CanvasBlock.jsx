import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import {
  Copy, Pencil, X, TrendingUp, TrendingDown, Minus, GripVertical, MoreVertical, Trash,
  Users, FlaskConical, ClipboardList, UserRound,
  Search, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
import { getCardIcon } from '@/lib/cardIcons'
import { useCountUp } from '@/hooks/useCountUp'

const BASE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#a78bfa']
const TOOLTIP_PROPS = {
  contentStyle: { background: '#0a1628', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 8, fontSize: 11 },
  itemStyle: { color: '#94a3b8' },
}

function chartDot(color, chartScale) {
  const size = Math.max(4, Math.round(4.5 * chartScale))
  return {
    r: size,
    fill: color,
    stroke: '#ffffff',
    strokeWidth: 1.75,
    fillOpacity: 1,
    opacity: 1,
  }
}

const STAT_META = {
  'kpi-card': { dataKey: 'totalScreened', label: 'KPI Card', icon: Users, defaultColor: '#3b82f6', trend: +12.3 },
  'stat-total': { dataKey: 'totalScreened', label: 'Total Patients Screened', icon: Users, defaultColor: '#3b82f6', trend: +12.3 },
  'stat-positive': { dataKey: 'oralCancer', label: 'Positive Cases', icon: ClipboardList, defaultColor: '#ef4444', trend: -15.3 },
  'stat-normal': { dataKey: 'normal', label: 'Normal / Clear', icon: UserRound, defaultColor: '#10b981', trend: +12 },
  'stat-oral': { dataKey: 'oralCancer', label: 'Oral Cancer +ve', icon: FlaskConical, defaultColor: '#f97316', trend: -2 },
  'stat-anemia': { dataKey: 'anemia', label: 'Anemia +ve', icon: ClipboardList, defaultColor: '#ec4899', trend: +5 },
  'stat-locations': { dataKey: 'locations', label: 'Referred', icon: UserRound, defaultColor: '#8b5cf6', trend: +8.1 },
  'stat-tests': { dataKey: 'testsTotal', label: 'Tests Conducted', icon: FlaskConical, defaultColor: '#f59e0b', trend: +12.7 },
}

const CFG = {
  'kpi-card': { title: 'KPI Card', subtitle: 'Quick metric snapshot', color: '#3b82f6' },
  'chart-bar': { title: 'Screenings by Day', subtitle: 'Daily breakdown', color: '#3b82f6' },
  'chart-hbar': { title: 'Tests Conducted by Type', subtitle: 'Horizontal breakdown', color: '#3b82f6' },
  'chart-map': { title: 'Map Chart', subtitle: 'Geographic overview', color: '#06b6d4' },
  'chart-heatmap': { title: 'Heat Map', subtitle: 'Intensity by day', color: '#ef4444' },
  'chart-stacked': { title: 'Stacked Results', subtitle: 'Positive vs normal', color: '#8b5cf6' },
  'chart-line': { title: 'Screening Trend', subtitle: 'Week overview', color: '#10b981' },
  'chart-area': { title: 'Area Trend', subtitle: 'Cumulative view', color: '#06b6d4' },
  'chart-combo': { title: 'Combo Trend', subtitle: 'Bars with line overlay', color: '#14b8a6' },
  'chart-stackedarea': { title: 'Stacked Area', subtitle: 'Layered trend view', color: '#0ea5e9' },
  'chart-sparkline': { title: 'Sparkline', subtitle: 'Compact trend summary', color: '#22c55e' },
  'chart-radar': { title: 'Radar View', subtitle: 'Multi-metric profile', color: '#a855f7' },
  'chart-pie': { title: 'Screening Outcomes', subtitle: 'Result distribution', color: '#f59e0b' },
  'chart-donut': { title: 'Test Type Split', subtitle: 'By test category', color: '#ec4899' },
  'chart-radialbar': { title: 'Camp Progress', subtitle: 'Screened per camp', color: '#f97316' },
  'chart-scatter': { title: 'Age Distribution', subtitle: 'By age group', color: '#a78bfa' },
  num: { title: 'Key Statistics', subtitle: 'Live drive numbers', color: '#34d399' },
  table: { title: 'Patient Records', subtitle: 'Screening data', color: '#94a3b8' },
  'advanced-table': { title: 'Advanced Table', subtitle: 'Richer table view', color: '#94a3b8' },
  'pivot-table': { title: 'Pivot Table', subtitle: 'Grouped summary', color: '#94a3b8' },
  'layout-row': { title: 'Row', subtitle: 'Horizontal layout', color: '#64748b' },
  'layout-column': { title: 'Column', subtitle: 'Vertical layout', color: '#64748b' },
  'layout-text': { title: 'Text / Title', subtitle: 'Text block', color: '#64748b' },
  'layout-image': { title: 'Image', subtitle: 'Image placeholder', color: '#64748b' },
  'layout-divider': { title: 'Divider', subtitle: 'Section separator', color: '#64748b' },
  'layout-spacer': { title: 'Spacer', subtitle: 'Blank spacing block', color: '#64748b' },
  'stat-total': { title: 'Total Patients', subtitle: 'Screened this drive', color: '#06b6d4' },
  'stat-positive': { title: 'Positive Cases', subtitle: 'Requires follow-up', color: '#ef4444' },
  'stat-normal': { title: 'Normal / Clear', subtitle: 'No issues detected', color: '#10b981' },
  'stat-oral': { title: 'Oral Cancer +ve', subtitle: 'Oral cancer positives', color: '#f97316' },
  'stat-anemia': { title: 'Anemia +ve', subtitle: 'Anemia positive cases', color: '#ec4899' },
  'stat-locations': { title: 'Camp Locations', subtitle: 'Active sites', color: '#8b5cf6' },
  'stat-tests': { title: 'Tests Conducted', subtitle: 'Total tests run', color: '#f59e0b' },
  'chart-hbar': { title: 'Horizontal Bar', subtitle: 'Ranked metrics', color: '#60a5fa' },
}

function axisProps(fontSize, fontFamily, fontWeight) {
  return {
    fontSize: Math.max(8, fontSize - 1),
    fill: '#64748b',
    fontFamily,
    fontWeight,
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function toWeight(weight) {
  if (typeof weight === 'number' && Number.isFinite(weight)) return clamp(weight, 300, 800)
  const value = String(weight || '').toLowerCase()
  if (value.includes('700') || value.includes('bold')) return 700
  if (value.includes('600') || value.includes('semi')) return 600
  if (value.includes('500') || value.includes('medium')) return 500
  return 400
}

function scaledFontSize(baseSize, scale, min, max) {
  const parsed = Number(baseSize)
  const normalized = Number.isFinite(parsed) ? parsed : 11
  return Math.round(clamp(normalized * scale, min, max))
}

function formatMetricValue(value, format = 'comma', suffix = '') {
  const num = Number(value) || 0
  let formatted = String(Math.round(num))

  switch (format) {
    case 'plain':
      formatted = String(Math.round(num))
      break
    case 'decimal':
      formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num)
      break
    case 'compact':
      formatted = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
      break
    case 'currency':
      formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
      break
    case 'comma':
    default:
      formatted = new Intl.NumberFormat('en-US').format(num)
      break
  }

  return suffix ? `${formatted} ${suffix}` : formatted
}

function formatComparisonValue(trend, format = 'percentage') {
  const direction = trend > 0 ? '▲' : trend < 0 ? '▼' : '•'
  const magnitude = Math.abs(Number(trend) || 0)
  if (format === 'value') return `${direction} ${magnitude.toLocaleString('en-US')}`
  if (format === 'both') return `${direction} ${magnitude.toFixed(1)}%`
  return `${direction} ${magnitude.toFixed(1)}%`
}

function buildLegendItems(type, opts, xKey, yKey, yKey2, extraYKeys, extraYLabels, extraYColors, data) {
  const items = []
  const seen = new Set()
  const addItem = (key, label, color) => {
    if (!key || seen.has(key)) return
    seen.add(key)
    items.push({ key, label, color })
  }

  if (type === 'chart-pie' || type === 'chart-donut') {
    const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
    ;(Array.isArray(data) ? data : []).forEach((item, index) => {
      const label = item.label || item.name || item[xKey] || `Item ${index + 1}`
      const color = palette[index % palette.length]
      addItem(`${label}-${index}`, label, color)
    })
    return items
  }

  if (type === 'chart-radialbar') {
    const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
    ;(Array.isArray(data) ? data : []).forEach((item, index) => {
      const label = item[xKey] || item.name || item.label || `Item ${index + 1}`
      const color = palette[index % palette.length]
      addItem(`${label}-${index}`, label, color)
    })
    return items
  }

  addItem(yKey, yKey, opts.color)
  addItem(yKey2, yKey2, opts.series2Color)
  extraYKeys.forEach((key, index) => addItem(key, extraYLabels[index] || key, extraYColors[index]))
  return items
}

function renderLegendBlock(items, position = 'bottom', chartFontSize = 11, orientation = 'auto', align = 'center', fontFamily, fontWeight) {
  if (!items.length) return null
  const isSide = position === 'left' || position === 'right'
  const resolved = orientation === 'auto'
    ? (isSide ? 'vertical' : 'horizontal')
    : orientation
  const vertical = resolved === 'vertical'
  // Side + horizontal is a special combo: a small horizontal pill sitting
  // on the left or right edge of the chart. It uses row layout but allows
  // wrapping so multiple items stay readable in a narrow column.
  const sideHorizontal = isSide && !vertical
  // Map alignment along the legend's main axis.
  // - top/bottom (row):    start=left,  center=center, end=right
  // - left/right vertical: start=top,   center=middle, end=bottom
  // - left/right horizontal pill: align the wrapped row vertically
  //   inside the side column (top/middle/bottom).
  const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end' }
  const mainAlign = alignMap[align] || 'center'

  // Side legends render as a clean vertical list along the chart edge.
  // We use writing-mode (instead of transform) so the layout box also
  // rotates and items don't overlap each other.
  // - left  side: text reads bottom-to-top  (vertical-rl + 180° flip)
  // - right side: text reads top-to-bottom  (vertical-rl)
  const sideVertical = isSide && vertical
  const itemWritingMode = sideVertical ? 'vertical-rl' : 'horizontal-tb'
  const itemFlipped = sideVertical && position === 'left'
  const itemMainAxis = sideVertical
    ? 'center'
    : (sideHorizontal ? 'center' : 'center')

  const style = {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    flexWrap: sideHorizontal ? 'wrap' : 'nowrap',
    // Inner item alignment — kept centered; the LEGEND BLOCK itself is
    // positioned via alignSelf below, which is what the user's alignment
    // control actually drives.
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    gap: vertical ? (sideVertical ? 10 : 4) : (sideHorizontal ? 6 : 12),
    padding: isSide
      ? (sideVertical ? '6px 4px' : '4px 4px')
      : '4px 6px',
    // Always size the legend to its content along the shell's cross axis,
    // so alignSelf can place it at start / center / end on the chart edge.
    // - top/bottom (column shell): cross axis = horizontal → width auto
    // - left/right (row shell):    cross axis = vertical   → height auto
    width: isSide ? 'auto' : 'auto',
    height: isSide ? 'fit-content' : 'auto',
    minWidth: 0,
    minHeight: 0,
    // Cap side+horizontal pill width so the wrapped row doesn't eat the chart.
    maxWidth: sideHorizontal ? 110 : '100%',
    flexShrink: 0,
    overflow: 'hidden',
    // Position the legend block along the chart edge:
    // - top/bottom: alignSelf controls horizontal placement (start/center/end → L/C/R)
    // - left/right: alignSelf controls vertical placement (start/center/end → T/M/B)
    alignSelf: mainAlign,
    textAlign: 'center',
  }

  return (
    <div className={`chart-legend chart-legend--${position} chart-legend--${resolved}`} style={style}>
      {items.map((item) => (
        <div
          key={item.key}
          className="chart-legend__item"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: itemMainAxis,
            gap: sideVertical ? 4 : 6,
            minWidth: 0,
            width: 'auto',
            // Hard-lock each rotated item to its content size so the
            // column flex layout can't stretch them apart.
            flex: '0 0 auto',
            blockSize: 'fit-content',
            inlineSize: 'fit-content',
            // Vertical writing-mode rotates both the text and the layout
            // box, so stacked items don't overlap each other.
            writingMode: itemWritingMode,
            // Flip 180deg for the left side so the label reads
            // bottom-to-top (the conventional Y-axis title orientation).
            transform: itemFlipped ? 'rotate(180deg)' : 'none',
            whiteSpace: 'nowrap',
            margin: 0,
            padding: 0,
          }}
        >
          <span style={{
            width: sideVertical ? 6 : 8,
            height: sideVertical ? 6 : 8,
            borderRadius: 999,
            background: item.color,
            flexShrink: 0,
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: Math.max(8, chartFontSize),
            color: item.color,
            fontFamily,
            fontWeight: fontWeight || 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.1,
            margin: 0,
            padding: 0,
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function wrapChartWithLegend(chartNode, items, position = 'bottom', chartFontSize = 11, orientation = 'auto', align = 'center', fontFamily, fontWeight) {
  if (!items.length) return chartNode
  const isSide = position === 'left' || position === 'right'
  // Whenever the legend is on the left/right, the shell is a row so the
  // legend (regardless of its own orientation) sits beside the chart.
  // top/bottom keep the historical column shell.
  const useRowShell = isSide
  const showLegendOnTop = position === 'top'
  const showLegendOnBottom = position === 'bottom'

  return (
    <div
      className={`chart-shell chart-shell--${position} chart-shell--${orientation === 'auto' ? (isSide ? 'vertical' : 'horizontal') : orientation}`}
      style={{
        display: 'flex',
        flexDirection: useRowShell ? 'row' : 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        gap: useRowShell ? 2 : 4,
        padding: useRowShell ? '4px 4px 6px' : '2px 6px 12px',
        overflow: 'hidden',
      }}
    >
      {showLegendOnTop && renderLegendBlock(items, position, chartFontSize, orientation, align, fontFamily, fontWeight)}
      {useRowShell && position === 'left' && renderLegendBlock(items, position, chartFontSize, orientation, align, fontFamily, fontWeight)}
      <div className="chart-shell__plot" style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, width: '100%', height: '100%' }}>
        {chartNode}
      </div>
      {useRowShell && position === 'right' && renderLegendBlock(items, position, chartFontSize, orientation, align, fontFamily, fontWeight)}
      {showLegendOnBottom && renderLegendBlock(items, position, chartFontSize, orientation, align, fontFamily, fontWeight)}
    </div>
  )
}

function getChartMargin(type) {
  switch (type) {
    case 'chart-line':
    case 'chart-area':
    case 'chart-combo':
    case 'chart-stackedarea':
      return { top: 10, right: 10, left: 0, bottom: 18 }
    case 'chart-sparkline':
      return { top: 6, right: 6, left: 0, bottom: 4 }
    case 'chart-bar':
    case 'chart-stacked':
    case 'chart-scatter':
      return { top: 10, right: 10, left: 0, bottom: 10 }
    case 'chart-hbar':
      return { top: 8, right: 12, left: 12, bottom: 8 }
    case 'chart-pie':
    case 'chart-donut':
    case 'chart-radar':
    case 'chart-radialbar':
      return { top: 6, right: 6, left: 6, bottom: 6 }
    default:
      return { top: 8, right: 8, left: 8, bottom: 8 }
  }
}

function pickOrDefault(options, value) {
  if (!options || options.length === 0) return ''
  return options.includes(value) ? value : options[0]
}

function seriesOptions(type) {
  switch (type) {
    case 'chart-bar':
    case 'chart-line':
    case 'chart-area':
    case 'chart-combo':
    case 'chart-stackedarea':
      return { x: ['day'], y: ['screened', 'positive', 'normal'], hasSecondary: true }
    case 'chart-sparkline':
      return { x: ['day'], y: ['screened'], hasSecondary: false }
    case 'chart-hbar':
      return { x: ['name'], y: ['value'], hasSecondary: false }
    case 'chart-stacked':
      return { x: ['day'], y: ['normal', 'positive', 'screened'], hasSecondary: true }
    case 'chart-radar':
      return { x: ['camp'], y: ['screened', 'positive'], hasSecondary: true }
    case 'chart-pie':
    case 'chart-donut':
      return { x: ['label'], y: ['value'], hasSecondary: false }
    case 'chart-radialbar':
      return { x: ['camp'], y: ['screened', 'positive'], hasSecondary: false }
    case 'chart-scatter':
      return { x: ['group'], y: ['count'], hasSecondary: false }
    case 'num':
      return { x: ['label'], y: ['value'], hasSecondary: false }
    default:
      return { x: ['day'], y: ['screened'], hasSecondary: false }
  }
}

// --- Advanced Table -------------------------------------------------------
// Searchable, sortable patient drive table with status badges per row.
function AdvancedTable({ rows = [], fontSize = 11 }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      String(r.name || '').toLowerCase().includes(q) ||
      String(r.location || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  const sorted = useMemo(() => {
    const list = [...filtered]
    const { key, dir } = sort
    list.sort((a, b) => {
      let av = a[key]
      let bv = b[key]
      if (key === 'date') { av = a.dateISO || a.date; bv = b.dateISO || b.date }
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av
      av = String(av ?? '').toLowerCase()
      bv = String(bv ?? '').toLowerCase()
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageData = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key) => {
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' })
    setPage(1)
  }

  const SortIcon = ({ k }) => {
    if (sort.key !== k) return <ArrowUpDown size={11} style={{ opacity: 0.4 }} />
    return sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const statusFor = (row) => {
    const screened = Number(row.screened) || 0
    const positive = Number(row.positive) || 0
    const ratio = screened > 0 ? (positive / screened) * 100 : 0
    if (ratio >= 12) return { label: 'Critical', bg: '#fee2e2', fg: '#b91c1c' }
    if (ratio >= 7)  return { label: 'Moderate', bg: '#fef3c7', fg: '#b45309' }
    return { label: 'Stable', bg: '#dcfce7', fg: '#15803d' }
  }

  const cols = [
    { key: 'name', label: 'Drive Name' },
    { key: 'location', label: 'Location' },
    { key: 'date', label: 'Date' },
    { key: 'screened', label: 'Screened' },
    { key: 'positive', label: 'Positive' },
    { key: 'referred', label: 'Referred' },
  ]

  return (
    <div className="pt-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'relative', flex: '1 1 auto' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by drive or location..."
            style={{
              width: '100%', padding: '5px 8px 5px 26px',
              fontSize: Math.max(10, fontSize - 1),
              border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none',
              background: '#fff', color: '#334155',
            }}
          />
        </div>
        <span style={{ fontSize: Math.max(9, fontSize - 2), color: '#64748b', whiteSpace: 'nowrap' }}>
          {sorted.length} result{sorted.length === 1 ? '' : 's'}
        </span>
      </div>
      <table className="pt-table" style={{ fontSize: Math.max(9, fontSize - 1) }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {c.label} <SortIcon k={c.key} />
                </span>
              </th>
            ))}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((p, i) => {
            const s = statusFor(p)
            return (
              <tr key={p.id || i}>
                <td style={{ color: '#1e40af', fontWeight: 500 }}>{p.name}</td>
                <td>{p.location}</td>
                <td>{p.date}</td>
                <td>{p.screened?.toLocaleString()}</td>
                <td>{p.positive}</td>
                <td>{p.referred}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: s.bg, color: s.fg,
                    padding: '2px 8px', borderRadius: 999,
                    fontSize: Math.max(9, fontSize - 2), fontWeight: 600,
                  }}>{s.label}</span>
                </td>
              </tr>
            )
          })}
          {pageData.length === 0 && (
            <tr><td colSpan={cols.length + 1} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>No matching drives</td></tr>
          )}
        </tbody>
      </table>
      <div className="pt-pagination">
        <span className="pt-page-info">
          Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, sorted.length)} of {sorted.length} drives
        </span>
        <div className="pt-page-btns">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const n = i + 1
            return (
              <button
                key={n}
                className={`pt-page-btn${n === safePage ? ' active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Basic Table ----------------------------------------------------------
// Patient drive list with working pagination.
function BasicTable({ rows = [], fontSize = 11 }) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pageData = rows.slice(startIndex, startIndex + pageSize)

  return (
    <div className="pt-wrap">
      <table className="pt-table" style={{ fontSize: Math.max(9, fontSize - 1) }}>
        <thead>
          <tr>{['Drive Name', 'Location', 'Date', 'Patients Screened', 'Positive Cases', 'Referred', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {pageData.map((p, i) => (
            <tr key={p.id || startIndex + i}>
              <td style={{ color: '#1e40af', fontWeight: 500 }}>{p.name}</td>
              <td>{p.location}</td>
              <td>{p.date}</td>
              <td>{p.screened?.toLocaleString()}</td>
              <td>{p.positive}</td>
              <td>{p.referred}</td>
              <td><span style={{ cursor: 'pointer', color: '#64748b' }}>👁</span></td>
            </tr>
          ))}
          {pageData.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>No data</td></tr>
          )}
        </tbody>
      </table>
      <div className="pt-pagination">
        <span className="pt-page-info">
          Showing {rows.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, rows.length)} of {rows.length} drives
        </span>
        <div className="pt-page-btns">
          <button
            className="pt-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            style={{ opacity: safePage <= 1 ? 0.4 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const n = i + 1
            return (
              <button
                key={n}
                className={`pt-page-btn${n === safePage ? ' active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            )
          })}
          <button
            className="pt-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            style={{ opacity: safePage >= totalPages ? 0.4 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }}
          >›</button>
        </div>
      </div>
    </div>
  )
}

// --- Pivot Table ----------------------------------------------------------
// Aggregates patient table rows by State (the part after the comma in
// `location`) and shows totals + average positivity rate.
function PivotTable({ rows = [], fontSize = 11 }) {
  const groups = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      const parts = String(row.location || 'Unknown').split(',')
      const state = (parts[1] || parts[0] || 'Unknown').trim() || 'Unknown'
      const entry = map.get(state) || { state, drives: 0, screened: 0, positive: 0, referred: 0 }
      entry.drives += 1
      entry.screened += Number(row.screened) || 0
      entry.positive += Number(row.positive) || 0
      entry.referred += Number(row.referred) || 0
      map.set(state, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.screened - a.screened)
  }, [rows])

  const totals = useMemo(() => groups.reduce((acc, g) => ({
    drives: acc.drives + g.drives,
    screened: acc.screened + g.screened,
    positive: acc.positive + g.positive,
    referred: acc.referred + g.referred,
  }), { drives: 0, screened: 0, positive: 0, referred: 0 }), [groups])

  const rate = (p, s) => (s > 0 ? ((p / s) * 100).toFixed(1) : '0.0')

  return (
    <div className="pt-wrap">
      <table className="pt-table" style={{ fontSize: Math.max(9, fontSize - 1) }}>
        <thead>
          <tr>
            <th>State / Region</th>
            <th>Drives</th>
            <th>Screened</th>
            <th>Positive</th>
            <th>Referred</th>
            <th>Positive %</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.state}>
              <td style={{ color: '#1e40af', fontWeight: 500 }}>{g.state}</td>
              <td>{g.drives}</td>
              <td>{g.screened.toLocaleString()}</td>
              <td>{g.positive.toLocaleString()}</td>
              <td>{g.referred.toLocaleString()}</td>
              <td>{rate(g.positive, g.screened)}%</td>
            </tr>
          ))}
          {groups.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>No data</td></tr>
          )}
        </tbody>
        {groups.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
              <td>Total</td>
              <td>{totals.drives}</td>
              <td>{totals.screened.toLocaleString()}</td>
              <td>{totals.positive.toLocaleString()}</td>
              <td>{totals.referred.toLocaleString()}</td>
              <td>{rate(totals.positive, totals.screened)}%</td>
            </tr>
          </tfoot>
        )}
      </table>
      <div className="pt-pagination">
        <span className="pt-page-info">Aggregated across {rows.length} drives in {groups.length} region{groups.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  )
}

function StatBlock({ type, data, props, scale = 1 }) {
  const meta = STAT_META[type] || STAT_META['stat-total']
  if (!meta) return null
  const metricKey = props.metricKey || meta.dataKey
  const varEntry = data?.statVariables?.find((v) => v.key === metricKey) || data?.statVariables?.find((v) => v.key === meta.dataKey)
  const rawValue = varEntry?.value ?? 0
  const color = props.itemColor || props.color || meta.defaultColor
  const iconColor = props.iconColor || color

  // Allow user to override trend value/direction inline.
  const overrideTrend = props.trendValue !== undefined && props.trendValue !== ''
    ? Number(props.trendValue)
    : null
  const trendNum = overrideTrend !== null
    ? overrideTrend
    : (type === 'stat-positive' ? -Math.abs(meta.trend) : meta.trend)

  const TrendIcon = trendNum > 0 ? TrendingUp : trendNum < 0 ? TrendingDown : Minus
  const trendColor = trendNum < 0 ? (props.decreaseColor || '#dc2626') : (props.increaseColor || '#16a34a')

  // Icon resolution: user-picked iconKey wins, otherwise the meta default.
  const Icon = props.iconKey ? getCardIcon(props.iconKey, meta.icon) : meta.icon

  // Animated count-up for the numeric value.
  // A non-empty `metricValue` always wins over the dropdown-selected metric,
  // so the user can type any custom number into the panel.
  const hasManualValue = props.metricValue !== undefined && props.metricValue !== null && String(props.metricValue).trim() !== ''
  const parsedManual = hasManualValue
    ? Number(String(props.metricValue).replace(/[^0-9.\-]/g, ''))
    : NaN
  const manualIsNumeric = hasManualValue && !Number.isNaN(parsedManual)
  const numericValue = manualIsNumeric
    ? parsedManual
    : Number(rawValue) || 0
  const animated = useCountUp(numericValue)
  const displayValue = hasManualValue && !manualIsNumeric
    ? String(props.metricValue) // free-form text (non-numeric override)
    : formatMetricValue(animated, props.numberFormat || 'comma', props.suffix || '')

  const comparisonLabel = props.comparisonLabel || data?.comparisonLabel || 'vs Apr 1 - Apr 30, 2025'
  const valueDelta = props.metricDelta
    || formatComparisonValue(trendNum, props.comparisonFormat || 'percentage')
  const titleText = props.title || meta.label

  // Variant resolution + progress bar.
  // 'stat-positive' is labeled "Progress Indicator" in the Left Panel,
  // so it gets a progress bar by default when a target is set.
  const isProgressVariant = type === 'stat-positive' || Number(props.targetValue) > 0
  const targetVal = Number(props.targetValue) || 0
  const progressPct = targetVal > 0
    ? Math.max(0, Math.min(100, (numericValue / targetVal) * 100))
    : 0

  const s = Math.max(0.7, Math.min(2.5, scale || 1))
  const iconBox = Math.round(48 * s)
  const iconSize = Math.round(24 * s)
  const titleSize = +(13 * s).toFixed(2)
  const valueSize = +(26 * s).toFixed(2)
  const subSize = +(11 * s).toFixed(2)
  const trendSize = +(13 * s).toFixed(2)
  const trendIconSize = Math.round(14 * s)
  const padX = Math.round(18 * s)
  const padY = Math.round(10 * s)
  // Slightly larger top padding so the title clears the drag-handle row,
  // but kept tight enough to avoid clipping the subtitle/trend at the bottom.
  const padTop = Math.round(18 * s)

  return (
    <div
      className={`stat-block-render stat-block-render--modern${isProgressVariant && targetVal > 0 ? ' stat-block-render--has-progress' : ''}`}
      style={{ '--sb-color': color, padding: `${padTop}px ${padX}px ${padY}px ${padX}px` }}
    >
      <div className="sb-modern-row">
        <div className="sb-modern-left">
          <span className="sb-modern-title" style={{ fontSize: titleSize }}>{titleText}</span>
          <span
            key={numericValue}
            className="sb-modern-value sb-modern-value--animated"
            style={{ color: props.valueColor || '#111827', fontSize: valueSize }}
          >
            {displayValue}
          </span>
          {props.showComparison !== false && (
            <span className="sb-modern-subtitle" style={{ fontSize: subSize }}>{comparisonLabel}</span>
          )}
        </div>
        <div className="sb-modern-right" style={{ paddingTop: 0 }}>
          <div
            className="sb-icon-wrap"
            style={{ background: `${color}1f`, border: 'none', color: iconColor, width: iconBox, height: iconBox }}
          >
            <Icon size={iconSize} strokeWidth={2.1} color={iconColor} />
          </div>
          {props.showTrend !== false && (
            <div className="sb-modern-trend" style={{ color: trendColor, fontSize: trendSize }}>
              <span className="sb-modern-trend-text">{valueDelta}</span>
              <TrendIcon size={trendIconSize} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      {isProgressVariant && targetVal > 0 && (
        <div className="sb-progress" style={{ marginTop: Math.round(10 * s) }}>
          <div className="sb-progress-track">
            <div
              className="sb-progress-fill"
              style={{ width: `${progressPct}%`, background: color }}
            />
          </div>
          <div className="sb-progress-meta" style={{ fontSize: Math.max(9, subSize - 1) }}>
            <span>{progressPct.toFixed(1)}%</span>
            <span>of {formatMetricValue(targetVal, props.numberFormat || 'comma', props.suffix || '')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DataEditor({ block, rows, onSave, onClose }) {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(rows)))
  const labelKey = { 
    'chart-pie': 'label', 
    'chart-donut': 'label', 
    'chart-radialbar': 'camp', 
    'chart-scatter': 'group', 
    'chart-map': 'camp',
    'chart-radar': 'camp',
    'chart-hbar': 'name',
    'chart-treemap': 'name',
    num: 'label', 
    table: 'name' 
  }[block.type] || 'day'
  const numKeys = data[0] ? Object.keys(data[0]).filter((k) => k !== labelKey && typeof data[0][k] === 'number') : []

  function update(ri, key, val) {
    setData((prev) => { const next = prev.map((r) => ({ ...r })); next[ri][key] = Number.isNaN(+val) ? val : +val; return next })
  }

  function addRow() {
    const template = { ...data[data.length - 1] }
    template[labelKey] = 'New'
    numKeys.forEach((k) => { template[k] = 0 })
    setData((prev) => [...prev, template])
  }

  function delRow(i) {
    if (data.length <= 2) return
    setData((prev) => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="data-editor">
      <div className="de-header">
        <span className="de-title">Edit Chart Data</span>
        <div className="de-actions">
          <button className="de-save" onClick={() => onSave(data)}>Save</button>
          <button className="de-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
      <div className="de-body">
        <table className="de-table">
          <thead>
            <tr>
              <th>{labelKey}</th>
              {numKeys.map((k) => <th key={k}>{k}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri}>
                <td><input className="de-input" value={row[labelKey] ?? ''} onChange={(e) => update(ri, labelKey, e.target.value)} /></td>
                {numKeys.map((k) => (
                  <td key={k}><input type="number" className="de-input" value={row[k] ?? 0} onChange={(e) => update(ri, k, e.target.value)} /></td>
                ))}
                <td><button className="de-del" onClick={() => delRow(ri)} style={{ opacity: data.length <= 2 ? 0.3 : 1 }}>x</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="de-add-row" onClick={addRow}>+ Add Row</button>
      </div>
    </div>
  )
}

function initData(type, data) {
  if (type.startsWith('stat-')) return []
  const clone = (d) => JSON.parse(JSON.stringify(d))
  switch (type) {
    case 'chart-bar': case 'chart-stacked': case 'chart-line': case 'chart-area':
    case 'chart-combo': case 'chart-stackedarea': case 'chart-sparkline':
      return clone(data.screeningByDayData)
    case 'chart-hbar': return clone(data.testTypeData)
    case 'chart-map': return clone(data.campLocationData)
    case 'chart-heatmap': return clone(data.screeningByDayData)
    case 'chart-radar': return clone(data.campLocationData)
    case 'chart-pie': return clone(data.outcomeChartData)
    case 'chart-donut': return clone(data.outcomeChartData)
    case 'chart-radialbar': return clone(data.campLocationData)
    case 'chart-scatter': return clone(data.ageGroupData)
    case 'num': return clone(data.statVariables)
    case 'kpi-card': return clone(data.statVariables)
    case 'table': return clone(data.patientTableData)
    case 'advanced-table': return clone(data.patientTableData)
    case 'pivot-table': return clone(data.patientTableData)
    case 'layout-text':
    case 'layout-image':
    case 'layout-divider':
    case 'layout-spacer':
    case 'layout-row':
    case 'layout-column':
      return []
    default: return []
  }
}

// â”€â”€ renderChart now accepts extraYColors + extraYLabels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderLayoutBlock(type, opts) {
  switch (type) {
    case 'layout-text':
      return (
        <div className="layout-widget layout-widget--text">
          <div className="layout-widget__eyebrow">Text block</div>
          <div className="layout-widget__heading">{opts.title || 'Text / Title'}</div>
          <div className="layout-widget__copy">{opts.text || 'Use this space for headings, notes, and short context.'}</div>
        </div>
      )

    case 'layout-image':
      return (
        <div className="layout-widget layout-widget--image">
          {opts.imageSrc ? (
            <div className="layout-image-preview">
              <img src={opts.imageSrc} alt={opts.imageAlt || 'Uploaded image'} />
            </div>
          ) : (
            <div className="layout-image-placeholder" aria-hidden="true">IMG</div>
          )}
          <div className="layout-widget__heading">{opts.title || 'Image placeholder'}</div>
          <div className="layout-widget__copy">{opts.imageAlt || 'Drop an image or keep this as a visual placeholder.'}</div>
        </div>
      )

    case 'layout-divider':
      return (
        <div className="layout-widget layout-widget--divider">
          <div className="layout-divider-line" />
          {(opts.dividerLabel || opts.title) && <div className="layout-divider-label">{opts.dividerLabel || opts.title}</div>}
        </div>
      )

    case 'layout-spacer':
      return (
        <div className="layout-widget layout-widget--spacer">
          <div className="layout-spacer-box">Spacer</div>
        </div>
      )

    case 'layout-row':
    case 'layout-column':
      return (
        <div className={`layout-widget layout-widget--structure layout-widget--${type.endsWith('row') ? 'row' : 'column'}`}>
          <div className="layout-structure-icon">{type.endsWith('row') ? 'ROW' : 'COL'}</div>
          <div className="layout-widget__heading">{opts.title || (type === 'layout-row' ? 'Row' : 'Column')}</div>
          <div className="layout-widget__copy">A structural block for organizing widgets visually.</div>
        </div>
      )

    default:
      return null
  }
}

function renderTreemapChart(d) {
  const sorted = [...d]
    .map((item, index) => ({
      name: item.camp,
      value: Number(item.screened || 0),
      positive: Number(item.positive || 0),
      fill: BASE_COLORS[index % BASE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)

  const rows = [[], [], []]
  const rowTotals = [0, 0, 0]
  sorted.forEach((item) => {
    const targetIndex = rowTotals.indexOf(Math.min(...rowTotals))
    rows[targetIndex].push(item)
    rowTotals[targetIndex] += item.value
  })

  const max = Math.max(...sorted.map((item) => item.value), 1)

  return (
    <div className="treemap-chart">
      <div className="treemap-chart__canvas">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="treemap-chart__row">
            {row.map((item) => {
              const strength = item.value / max
              return (
                <div
                  key={item.name}
                  className="treemap-chart__tile"
                  style={{
                    flex: `${Math.max(1, item.value)} 1 0%`,
                    background: `linear-gradient(180deg, rgba(59, 130, 246, ${0.14 + strength * 0.42}), rgba(59, 130, 246, ${0.08 + strength * 0.25}))`,
                    borderColor: `rgba(59, 130, 246, ${0.16 + strength * 0.42})`,
                  }}
                >
                  <span className="treemap-chart__camp">{item.name}</span>
                  <strong>{item.value.toLocaleString()}</strong>
                  <span>Positive {item.positive.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="treemap-chart__legend">
        <span className="treemap-chart__legend-item"><i style={{ background: '#3b82f6' }} /> Screened</span>
        <span className="treemap-chart__legend-item"><i style={{ background: '#ef4444' }} /> Positive cases</span>
      </div>
    </div>
  )
}

function parseHeatmapDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfWeekMonday(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeekSunday(date) {
  const d = startOfWeekMonday(date)
  d.setDate(d.getDate() + 6)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatHeatmapDay(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

function formatHeatmapWeekday(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).slice(0, 1)
}

function renderHeatMapChart(d) {
  const source = d
    .map((item) => {
      const date = parseHeatmapDate(item.date || item.dateISO || item.day)
      return date ? { ...item, __date: date } : null
    })
    .filter(Boolean)

  if (source.length === 0) {
    return (
      <div className="heatmap-chart heatmap-chart--empty">
        <div className="chart-empty-state">
          <div className="chart-empty-state__icon">ðŸ”¥</div>
          <div className="chart-empty-state__title">No calendar data</div>
          <div className="chart-empty-state__text">Add dated entries to see the heat map.</div>
        </div>
      </div>
    )
  }

  const minDate = source.reduce((acc, item) => (item.__date < acc ? item.__date : acc), source[0].__date)
  const maxDate = source.reduce((acc, item) => (item.__date > acc ? item.__date : acc), source[0].__date)
  const start = startOfWeekMonday(minDate)
  const end = endOfWeekSunday(maxDate)
  const totalDays = Math.round((end - start) / 86400000) + 1
  const calendar = Array.from({ length: totalDays }, (_, i) => addDays(start, i))
  const byIso = new Map(source.map((item) => [item.__date.toISOString().slice(0, 10), item]))
  const values = source.map((item) => Number(item.screened || item.value || 0))
  const max = Math.max(...values, 1)

  const weeks = Math.ceil(totalDays / 7)
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="heatmap-chart heatmap-chart--calendar">
      <div className="heatmap-chart__months">
        <span>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start)}</span>
        <span>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end)}</span>
      </div>
      <div
        className="heatmap-chart__calendar"
        style={{
          gridTemplateColumns: `18px repeat(${weeks}, minmax(0, 1fr))`,
          gridTemplateRows: 'repeat(7, minmax(18px, 1fr))',
        }}
      >
        {weekdays.map((day, i) => (
          <div key={day + i} className="heatmap-chart__weekday" style={{ gridRow: i + 1, gridColumn: 1 }}>
            {day}
          </div>
        ))}
        {calendar.map((date, i) => {
          const iso = date.toISOString().slice(0, 10)
          const item = byIso.get(iso)
          const value = Number(item?.screened ?? item?.value ?? 0)
          const strength = value / max
          const col = Math.floor(i / 7) + 2
          const row = ((date.getDay() + 6) % 7) + 1
          return (
            <div
              key={iso}
              className={`heatmap-chart__day${item ? ' is-active' : ''}`}
              title={item ? `${formatHeatmapDay(date)}: ${value} screened` : formatHeatmapDay(date)}
              style={{
                gridColumn: col,
                gridRow: row,
                background: item ? `rgba(239, 68, 68, ${0.12 + strength * 0.7})` : 'rgba(148, 163, 184, 0.08)',
                borderColor: item ? `rgba(239, 68, 68, ${0.18 + strength * 0.45})` : 'rgba(148, 163, 184, 0.12)',
              }}
            >
              {item && <strong>{value}</strong>}
            </div>
          )
        })}
      </div>
      <div className="heatmap-chart__scale">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  )
}

function renderChart(type, d, opts, blockId, layoutKey) {
  if (!Array.isArray(d) || d.length === 0) {
    return (
      <div className="chart-empty-state">
        <div className="chart-empty-state__icon">ðŸ“Š</div>
        <div className="chart-empty-state__title">No data available</div>
        <div className="chart-empty-state__text">Try a different date range or add chart data.</div>
      </div>
    )
  }

  if (type === 'chart-map') return renderTreemapChart(d, opts)
  if (type === 'chart-heatmap') return renderHeatMapChart(d, opts)

  const mapping = seriesOptions(type)
  const xKey = pickOrDefault(mapping.x, opts.xKey)
  const yKey = pickOrDefault(mapping.y, opts.yKey)
  const yKey2 = mapping.hasSecondary ? pickOrDefault(mapping.y, opts.yKey2 || mapping.y[1]) : ''

  const extraYKeys = Array.isArray(opts.extraYKeys) ? opts.extraYKeys.filter((k) => mapping.y.includes(k) && k !== yKey && k !== yKey2) : []
  // Per-field colors: fall back to BASE_COLORS if not set
  const extraYColors = Array.isArray(opts.extraYColors) && opts.extraYColors.length === opts.extraYKeys?.length
    ? opts.extraYColors
    : extraYKeys.map((_, i) => BASE_COLORS[(i + 2) % BASE_COLORS.length])
  // Per-field labels for legend: fall back to key name
  const extraYLabels = Array.isArray(opts.extraYLabels) && opts.extraYLabels.length === opts.extraYKeys?.length
    ? opts.extraYLabels
    : extraYKeys.map((k) => k)

  const chartScale = clamp(Number(opts.chartScale ?? 100) / 100, 0.7, 1.5)
  const chartFontSize = Math.max(8, Math.round(opts.fontSize * chartScale))
  const chartStrokeWidth = Math.max(1, Math.round(Number(opts.strokeWidth ?? 2) * chartScale))
  const chartBarSize = Math.max(8, Math.round(Number(opts.barSize ?? 12) * chartScale))
  const chartRadius = Math.max(2, Math.round(Number(opts.barRadius ?? 4) * chartScale))
  const ax = axisProps(chartFontSize, opts.fontFamily, opts.fontWeight)
  const legendPosition = opts.legendPosition || 'bottom'
  const legendOrientation = opts.legendOrientation || 'auto'
  const legendAlign = opts.legendAlign || 'center'
  const legendItems = opts.showLegend ? buildLegendItems(type, opts, xKey, yKey, yKey2, extraYKeys, extraYLabels, extraYColors, d) : []
  const grid = opts.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.18)" strokeWidth={1} /> : null
  const topRadius = [chartRadius, chartRadius, 0, 0]
  const withLegend = (chartNode) => wrapChartWithLegend(
    chartNode,
    legendItems,
    legendPosition,
    chartFontSize,
    legendOrientation,
    legendAlign,
    opts.fontFamily,
    opts.fontWeight,
  )

  switch (type) {
    case 'chart-bar':
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <BarChart data={d} margin={getChartMargin('chart-bar')}>
              {grid}
              <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
              <YAxis tick={ax} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Bar dataKey={yKey} fill={opts.color} radius={topRadius} barSize={chartBarSize} />
              {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} radius={topRadius} barSize={chartBarSize} />}
              {extraYKeys.map((k, i) => (
                <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} radius={topRadius} barSize={chartBarSize} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      )

    case 'chart-stacked':
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <BarChart data={d} margin={getChartMargin('chart-stacked')}>
              {grid}
              <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
              <YAxis tick={ax} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Bar dataKey={yKey} fill={opts.color} stackId="stack" radius={topRadius} barSize={chartBarSize} />
              {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} stackId="stack" radius={topRadius} barSize={chartBarSize} />}
              {extraYKeys.map((k, i) => (
                <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} stackId="stack" radius={topRadius} barSize={chartBarSize} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      )

    case 'chart-line':
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <LineChart data={d} margin={getChartMargin('chart-line')}>
              {grid}
              <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
              <YAxis tick={ax} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Line type="monotone" dataKey={yKey} stroke={opts.color} strokeWidth={chartStrokeWidth} dot={opts.showDots ? chartDot(opts.color, chartScale) : false} activeDot={opts.showDots ? { r: Math.max(4, Math.round(4.5 * chartScale)), stroke: '#fff', strokeWidth: 1.5 } : false} />
              {yKey2 && <Line type="monotone" dataKey={yKey2} stroke={opts.series2Color} strokeWidth={chartStrokeWidth} dot={opts.showDots ? chartDot(opts.series2Color, chartScale) : false} activeDot={opts.showDots ? { r: Math.max(4, Math.round(4.5 * chartScale)), stroke: '#fff', strokeWidth: 1.5 } : false} />}
              {extraYKeys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} name={extraYLabels[i]}
                  stroke={extraYColors[i]} strokeWidth={chartStrokeWidth}
                  dot={opts.showDots ? chartDot(extraYColors[i], chartScale) : false}
                  activeDot={opts.showDots ? { r: Math.max(4, Math.round(4.5 * chartScale)), stroke: '#fff', strokeWidth: 1.5 } : false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      )

    case 'chart-area': {
      const gradA = `grad-a-${blockId}`
      const gradB = `grad-b-${blockId}`
      const fillOpacity = Math.max(0.05, Math.min(0.8, opts.areaOpacity / 100))
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
          <AreaChart data={d} margin={getChartMargin('chart-area')}>
            <defs>
              <linearGradient id={gradA} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={opts.color} stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={opts.color} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={gradB} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={opts.series2Color} stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={opts.series2Color} stopOpacity={0.02} />
              </linearGradient>
              {extraYKeys.map((_, i) => (
                <linearGradient key={i} id={`grad-extra-${blockId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={extraYColors[i]} stopOpacity={fillOpacity} />
                  <stop offset="95%" stopColor={extraYColors[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            <Area type="monotone" dataKey={yKey} stroke={opts.color} fill={`url(#${gradA})`} strokeWidth={chartStrokeWidth} />
            {yKey2 && <Area type="monotone" dataKey={yKey2} stroke={opts.series2Color} fill={`url(#${gradB})`} strokeWidth={chartStrokeWidth} />}
            {extraYKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} name={extraYLabels[i]}
                stroke={extraYColors[i]}
                fill={`url(#grad-extra-${blockId}-${i})`}
                strokeWidth={chartStrokeWidth}
              />
            ))}
          </AreaChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-combo':
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
          <ComposedChart data={d} margin={getChartMargin('chart-combo')}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            <Bar dataKey={yKey} fill={opts.color} radius={topRadius} barSize={chartBarSize} />
            {yKey2 && (
              <Line type="monotone" dataKey={yKey2} stroke={opts.series2Color} strokeWidth={chartStrokeWidth} dot={opts.showDots ? chartDot(opts.series2Color, chartScale) : false} activeDot={opts.showDots ? { r: Math.max(4, Math.round(4.5 * chartScale)), stroke: '#fff', strokeWidth: 1.5 } : false} />
            )}
            {extraYKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} name={extraYLabels[i]} stroke={extraYColors[i]} strokeWidth={chartStrokeWidth} dot={false} />
            ))}
          </ComposedChart>
          </ResponsiveContainer>
        )
      )

    case 'chart-stackedarea':
      {
      const fillOpacity = Math.max(0.05, Math.min(0.8, opts.areaOpacity / 100))
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
          <AreaChart data={d} margin={getChartMargin('chart-stackedarea')}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            <Area type="monotone" dataKey={yKey} stackId="1" stroke={opts.color} fill={opts.color} fillOpacity={fillOpacity} strokeWidth={chartStrokeWidth} />
            {yKey2 && <Area type="monotone" dataKey={yKey2} stackId="1" stroke={opts.series2Color} fill={opts.series2Color} fillOpacity={Math.max(0.05, fillOpacity * 0.85)} strokeWidth={chartStrokeWidth} />}
            {extraYKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} name={extraYLabels[i]} stackId="1" stroke={extraYColors[i]} fill={extraYColors[i]} fillOpacity={Math.max(0.05, fillOpacity * 0.7)} strokeWidth={chartStrokeWidth} />
            ))}
          </AreaChart>
          </ResponsiveContainer>
        )
      )
      }

    case 'chart-sparkline':
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <LineChart data={d} margin={getChartMargin('chart-sparkline')}>
              <XAxis dataKey={xKey} hide />
              <YAxis hide />
              <Tooltip {...TOOLTIP_PROPS} />
              <Line type="monotone" dataKey={yKey} stroke={opts.color} strokeWidth={chartStrokeWidth} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )
      )

    case 'chart-pie': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      const pieInner = clamp(Math.round(Number(opts.innerRadius ?? 30) * chartScale), 0, 90)
      const pieOuter = clamp(
        Math.max(pieInner + 5, Math.round(Number(opts.outerRadius ?? 55) * chartScale)),
        pieInner + 5,
        90,
      )
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <PieChart margin={getChartMargin('chart-pie')}>
              <Pie data={d} cx="50%" cy="45%"
                innerRadius={`${pieInner}%`}
                outerRadius={`${pieOuter}%`}
                dataKey={yKey} nameKey={xKey} label={opts.pieLabel}
              >
                {d.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_PROPS} />
            </PieChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-donut': {
      const DONUT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899']
      const donutInner = clamp(Math.round(Number(opts.innerRadius ?? 52) * chartScale), 25, 85)
      const donutOuter = clamp(Math.round(Number(opts.outerRadius ?? 85) * chartScale), donutInner + 6, 95)
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <PieChart margin={getChartMargin('chart-donut')}>
              <Pie data={d} cx="50%" cy="50%"
                innerRadius={`${donutInner}%`} outerRadius={`${donutOuter}%`}
                dataKey="value" nameKey="label" paddingAngle={2} label={opts.pieLabel}
              >
                {d.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_PROPS} />
            </PieChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-radialbar': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      const sorted = [...d]
        .map((r) => ({ ...r, _val: Number(r[yKey]) || 0 }))
        .sort((a, b) => b._val - a._val)
        .slice(0, 8)
      const radial = sorted.map((r, i) => ({
        ...r,
        name: r[xKey],
        fill: palette[i % palette.length],
      }))
      const radialInner = clamp(Math.round(Number(opts.innerRadius ?? 20) * chartScale), 10, 50)
      const radialOuter = clamp(
        Math.max(radialInner + 30, Math.round(Number(opts.outerRadius ?? 95) * chartScale)),
        radialInner + 30,
        100,
      )
      const ringCount = Math.max(radial.length, 1)
      const radialBarSize = Math.max(
        4,
        Math.min(chartBarSize + 2, Math.floor(140 / ringCount))
      )
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={`${radialInner}%`}
              outerRadius={`${radialOuter}%`}
              barSize={radialBarSize}
              data={radial}
              startAngle={90}
              endAngle={-270}
              margin={getChartMargin('chart-radialbar')}
            >
              <RadialBar
                minAngle={4}
                background={{ fill: 'rgba(148,163,184,0.18)' }}
                clockWise
                dataKey={yKey}
                cornerRadius={Math.min(radialBarSize / 2, chartRadius + 2)}
                label={{
                  position: 'insideEnd',
                  fill: '#ffffff',
                  fontSize: Math.max(9, chartFontSize - 1),
                  fontWeight: 600,
                  formatter: (v) => v,
                }}
              />
              <Tooltip {...TOOLTIP_PROPS} />
            </RadialBarChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-radar': {
      const radarData = d.map((row) => ({
        ...row,
        screened: Number(row.screened ?? 0),
        positive: Number(row.positive ?? 0),
      }))
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <RadarChart data={radarData} margin={getChartMargin('chart-radar')}>
              <PolarGrid stroke="rgba(99,179,237,0.12)" />
              <PolarAngleAxis dataKey={xKey} tick={{ fontSize: Math.max(9, chartFontSize - 1), fill: '#64748b', fontFamily: opts.fontFamily, fontWeight: opts.fontWeight }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Radar dataKey={yKey} stroke={opts.color} fill={opts.color} fillOpacity={Math.max(0.05, Math.min(0.8, opts.areaOpacity / 100))} />
              {yKey2 && <Radar dataKey={yKey2} stroke={opts.series2Color} fill={opts.series2Color} fillOpacity={Math.max(0.05, Math.min(0.8, (opts.areaOpacity / 100) * 0.82))} />}
            </RadarChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-scatter': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <BarChart data={d} margin={getChartMargin('chart-scatter')}>
              {grid}
              <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
              <YAxis tick={ax} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Bar dataKey={yKey} radius={topRadius}>
                {d.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'chart-hbar': {
      const HBAR_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
      return (
        withLegend(
          <ResponsiveContainer key={layoutKey} width="100%" height="100%">
            <BarChart data={d} layout="vertical" margin={getChartMargin('chart-hbar')}>
              {grid}
              <XAxis type="number" tick={ax} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: Math.max(9, chartFontSize - 1), fill: '#475467', fontFamily: opts.fontFamily, fontWeight: opts.fontWeight }} axisLine={false} tickLine={false} width={100} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Bar dataKey={yKey} radius={[0, chartRadius, chartRadius, 0]} barSize={chartBarSize}>
                {d.map((_, i) => <Cell key={i} fill={HBAR_COLORS[i % HBAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      )
    }

    case 'num':
      return (
        <div className="stat-grid">
          {d.map((v, i) => {
            const c = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS][i % (2 + extraYColors.length + BASE_COLORS.length)]
            return (
              <div key={v.key || i} className="stat-cell" style={{ background: `${c}12`, borderColor: `${c}28` }}>
                <p className="stat-label" style={{ color: c, fontSize: opts.fontSize - 2 }}>{v.label}</p>
                <p className="stat-value" style={{ color: c, fontSize: Math.max(20, opts.fontSize + 12) }}>{Number(v.value).toLocaleString()}</p>
              </div>
            )
          })}
        </div>
      )

    case 'advanced-table':
      return <AdvancedTable rows={d} fontSize={opts.fontSize} />

    case 'pivot-table':
      return <PivotTable rows={d} fontSize={opts.fontSize} />

    case 'table':
      return <BasicTable rows={d} fontSize={opts.fontSize} />

    default:
      return <div style={{ color: '#475569', fontSize: 11, padding: 16 }}>Unknown block type: {type}</div>
  }
}

export default function CanvasBlock({ block, data, selected, onRemove, onDuplicate, onSelect, onUpdateBlock, onDragStart, liveWidth, liveHeight, responsiveMode = 'desktop', isPreviewMode = false }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const openMenuFromEvent = useCallback((e) => {
    e.stopPropagation()
    if (menuOpen) { setMenuOpen(false); return }
    const r = e.currentTarget.getBoundingClientRect()
    const menuW = 170
    const gap = 6
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    let left = r.right + gap
    if (left + menuW > vw - 8) left = Math.max(8, r.left - menuW - gap)
    let top = r.top
    if (top + 160 > vh - 8) top = Math.max(8, vh - 168)
    setMenuPos({ top, left })
    setMenuOpen(true)
  }, [menuOpen])

  const isStatBlock = block.type.startsWith('stat-') || block.type === 'num' || block.type === 'kpi-card'
  const isLayoutBlock = String(block.type || '').startsWith('layout-')
  const isTableBlock = block.type === 'table' || block.type === 'advanced-table' || block.type === 'pivot-table'
  const cardVariant = isStatBlock ? 'stat' : isTableBlock ? 'table' : isLayoutBlock ? 'layout' : 'chart'
  const base = CFG[block.type] || { title: 'Widget', subtitle: '', color: '#64748b' }

  const defaultW = isStatBlock ? 194 : isLayoutBlock ? 360 : 360
  const defaultH = isStatBlock ? 120 : block.type === 'layout-text' ? 140 : block.type === 'layout-image' ? 220 : block.type === 'layout-divider' ? 72 : block.type === 'layout-spacer' ? 120 : isLayoutBlock ? 180 : 300
  const currentW = liveWidth || block.props?.width || defaultW
  const currentH = liveHeight || block.props?.height || defaultH
  const layoutKey = `${isPreviewMode ? 'preview' : responsiveMode}-${Math.round(currentW)}x${Math.round(currentH)}`
  const scaleX = Math.max(0.55, Math.min(3, currentW / defaultW))
  const scaleY = Math.max(0.55, Math.min(3, currentH / defaultH))
  const scale = Math.sqrt(scaleX * scaleY)

  const liveData = useMemo(() => (
    block.props?.data?.length
      ? block.props.data
      : initData(block.type, data)
  ), [block.props?.data, block.type, data])

  const props = useMemo(() => ({
    // Spread the raw block props first so any extra fields (iconKey,
    // metricKey, targetValue, trendValue, numberFormat, suffix, itemColor,
    // iconColor, showTrend, showComparison, comparisonFormat, valueColor,
    // increaseColor, decreaseColor, etc.) flow through to the renderer.
    ...(block.props || {}),
    title: block.props?.title || base.title,
    subtitle: block.props?.subtitle ?? base.subtitle,
    color: block.props?.color || base.color,
    opacity: Number(block.props?.opacity ?? 100),
    radius: Number(block.props?.radius ?? 15),
    showLegend: block.props?.showLegend ?? true,
    showGrid: block.props?.showGrid ?? true,
    showDots: block.props?.showDots ?? true,
    pieLabel: block.props?.pieLabel ?? false,
    legendPosition: block.props?.legendPosition || 'bottom',
    legendOrientation: block.props?.legendOrientation || 'auto',
    legendAlign: block.props?.legendAlign || 'center',
    fontSize: scaledFontSize(block.props?.fontSize ?? 11, scale, 8, 42),
    headingFontSize: scaledFontSize(block.props?.headingFontSize ?? block.props?.fontSize ?? 11, scale, 8, 72),
    chartScale: Number(block.props?.chartScale ?? 100),
    fontFamily: block.props?.fontFamily || 'Plus Jakarta Sans',
    fontWeight: toWeight(block.props?.fontWeight || 'Regular (400)'),
    xKey: block.props?.xKey || '',
    yKey: block.props?.yKey || '',
    yKey2: block.props?.yKey2 || '',
    extraYKeys: Array.isArray(block.props?.extraYKeys) ? block.props.extraYKeys : [],
    extraYColors: Array.isArray(block.props?.extraYColors) ? block.props.extraYColors : [],
    extraYLabels: Array.isArray(block.props?.extraYLabels) ? block.props.extraYLabels : [],
    strokeWidth: Number(block.props?.strokeWidth ?? 2),
    barRadius: Number(block.props?.barRadius ?? 4),
    innerRadius: Number(block.props?.innerRadius ?? 30),
    outerRadius: Number(block.props?.outerRadius ?? 55),
    barSize: Number(block.props?.barSize ?? 12),
    areaOpacity: Number(block.props?.areaOpacity ?? 30),
    series2Color: block.props?.series2Color || '#ef4444',
    text: block.props?.text || 'Double-click to edit',
    imageAlt: block.props?.imageAlt || 'Image placeholder',
    imageSrc: block.props?.imageSrc || '',
    dividerLabel: block.props?.dividerLabel || '',
    metricValue: block.props?.metricValue || '',
    metricDelta: block.props?.metricDelta || '',
    comparisonLabel: block.props?.comparisonLabel || '',
  }), [block.props, base.color, base.subtitle, base.title, scale])

  return (
    <div
      className={`canvas-card canvas-card--${cardVariant}`}
      style={{
        height: '100%',
        opacity: props.opacity / 100,
        borderRadius: props.radius,
        fontFamily: props.fontFamily,
        overflow: menuOpen ? 'visible' : 'hidden',
        boxShadow: isStatBlock
          ? 'none'
          : selected
            ? `0 0 0 2px ${props.color}, var(--shadow-lg)`
            : hovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        borderColor: selected
          ? (isStatBlock ? '#d0d7de' : props.color)
          : hovered ? `${props.color}88` : `${props.color}44`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isPreviewMode ? undefined : onSelect}
    >
      <div className="card-accent" style={{ background: `linear-gradient(90deg,${props.color},${props.color}44)` }} />
      <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', padding: isStatBlock ? '4px 6px 0 6px' : '12px 14px 4px 14px', justifyContent: 'space-between', position: isStatBlock ? 'absolute' : 'static', top: isStatBlock ? 0 : undefined, left: isStatBlock ? 0 : undefined, right: isStatBlock ? 0 : undefined, zIndex: isStatBlock ? 5 : undefined, pointerEvents: isStatBlock ? 'none' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {!isPreviewMode && (
            <div className="block-drag-handle" style={{ cursor: 'grab', color: '#cbd5e1', display: 'flex', alignItems: 'center', marginTop: '2px' }} title="Drag to move" onMouseDown={onDragStart}>
              <GripVertical size={14} />
            </div>
          )}
          {!isStatBlock && (
          <div>
            <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span className="card-title" style={{ fontSize: props.headingFontSize, fontWeight: props.fontWeight, color: '#344054', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.18, overflowWrap: 'anywhere' }}>
                {props.title}
              </span>
            </div>
            {props.subtitle && <p className="card-subtitle" style={{ fontSize: scaledFontSize(Math.max(9, Number(block.props?.headingFontSize ?? block.props?.fontSize ?? 11) - 1), scale, 8, 56), margin: 0, color: '#64748b', lineHeight: 1.25, overflowWrap: 'anywhere', fontWeight: props.fontWeight }}>{props.subtitle}</p>}
          </div>
          )}
        </div>
        <div className="card-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', pointerEvents: 'auto' }}>

          {!isPreviewMode && (
            <button className="card-action-btn dup" onClick={openMenuFromEvent} title="More options" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex' }}>
              <MoreVertical size={13} />
            </button>
          )}

          {menuOpen && !isPreviewMode && typeof document !== 'undefined' && createPortal(
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
              />
              <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: '#fff', border: '1px solid #d0d5dd', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 9999, minWidth: '160px', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'none', width: '100%', cursor: 'pointer', fontSize: '13px', color: '#344054', borderBottom: '1px solid #f2f4f7', boxSizing: 'border-box' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  onClick={(e) => { e.stopPropagation(); setEditing(true); setMenuOpen(false); }}
                >
                  <Pencil size={15} style={{ color: '#667085' }} /> Edit Data
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'none', width: '100%', cursor: 'pointer', fontSize: '13px', color: '#344054', borderBottom: '1px solid #f2f4f7', boxSizing: 'border-box' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  onClick={(e) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); }}
                >
                  <Copy size={15} style={{ color: '#667085' }} /> Duplicate
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'none', width: '100%', cursor: 'pointer', fontSize: '13px', color: '#d92d20', boxSizing: 'border-box' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef3f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false); }}
                >
                  <Trash size={15} style={{ color: '#d92d20' }} /> Delete
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
      <div className={`card-body${isStatBlock ? ' card-body--stat' : ''}`}>
        <div className="card-body-content" key={layoutKey}>
          {isStatBlock ? (
            <StatBlock type={block.type} data={data} props={props} scale={scale} />
          ) : String(block.type || '').startsWith('layout-')
            ? renderLayoutBlock(block.type, props)
            : renderChart(block.type, liveData, props, block.id, layoutKey)}
        </div>
        {editing && !isStatBlock && !isPreviewMode && (
          <DataEditor
            block={block}
            rows={liveData}
            onSave={(rows) => {
              setEditing(false);
              onUpdateBlock?.(block.id, { data: rows });
            }}
            onClose={() => setEditing(false)}
          />
        )}
      </div>
    </div>
  )
}

