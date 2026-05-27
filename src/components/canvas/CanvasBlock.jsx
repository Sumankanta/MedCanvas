import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { Copy, Pencil, X, TrendingUp, TrendingDown, Minus, GripVertical, MoreVertical, Trash } from 'lucide-react'

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
  'kpi-card': { dataKey: 'totalScreened', label: 'KPI Card', icon: 'KPI', defaultColor: '#3b82f6', trend: +12.3 },
  'stat-total': { dataKey: 'totalScreened', label: 'Total Patients Screened', icon: '👥', defaultColor: '#3b82f6', trend: +12.3 },
  'stat-positive': { dataKey: 'oralCancer', label: 'Positive Cases', icon: '🩺', defaultColor: '#ef4444', trend: +15.3 },
  'stat-normal': { dataKey: 'normal', label: 'Normal / Clear', icon: '✅', defaultColor: '#10b981', trend: +12 },
  'stat-oral': { dataKey: 'oralCancer', label: 'Oral Cancer +ve', icon: '🦷', defaultColor: '#f97316', trend: -2 },
  'stat-anemia': { dataKey: 'anemia', label: 'Anemia +ve', icon: '💉', defaultColor: '#ec4899', trend: +5 },
  'stat-locations': { dataKey: 'locations', label: 'Referred', icon: '📍', defaultColor: '#8b5cf6', trend: +5.1 },
  'stat-tests': { dataKey: 'testsTotal', label: 'Tests Conducted', icon: '🔬', defaultColor: '#f59e0b', trend: +8.7 },
}

const CFG = {
  'kpi-card': { title: 'KPI Card', subtitle: 'Quick metric snapshot', color: '#3b82f6' },
  'chart-bar': { title: 'Screenings by Day', subtitle: 'Daily breakdown', color: '#3b82f6' },
  'chart-hbar': { title: 'Tests Conducted by Type', subtitle: 'Horizontal breakdown', color: '#3b82f6' },
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

function axisProps(fontSize) {
  return { fontSize: Math.max(8, fontSize - 1), fill: '#64748b' }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function toWeight(weight) {
  if (weight.includes('700')) return 700
  if (weight.includes('500')) return 500
  return 400
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

function renderStatBlock(type, data, props) {
  const meta = STAT_META[type] || STAT_META['stat-total']
  if (!meta) return null
  const varEntry = data?.statVariables?.find((v) => v.key === meta.dataKey)
  const value = varEntry?.value ?? 0
  const color = props.color || meta.defaultColor
  const trend = meta.trend
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b'

  return (
    <div className="stat-block-render" style={{ '--sb-color': color }}>
      <div className="sb-top">
        <div className="sb-icon-wrap" style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
          <span className="sb-emoji">{meta.icon}</span>
        </div>
        <div className="sb-value-wrap">
          <span className="sb-value" style={{ color: '#1e293b', fontSize: Math.max(26, props.fontSize + 18), fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
            {value.toLocaleString()}
          </span>
          <div className="sb-trend" style={{ color: trendColor }}>
            <TrendIcon size={11} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>
              {trend === 0 ? 'No change' : `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}%`}
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
            vs Apr 1 – Apr 30, 2025
          </span>
        </div>
      </div>
    </div>
  )
}

function DataEditor({ block, rows, onSave, onClose }) {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(rows)))
  const labelKey = { 'chart-pie': 'label', 'chart-donut': 'label', 'chart-radialbar': 'camp', 'chart-scatter': 'group', num: 'label', table: 'name' }[block.type] || 'day'
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

// ── renderChart now accepts extraYColors + extraYLabels ──────────────────────
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
          <div className="layout-image-placeholder" aria-hidden="true">IMG</div>
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

function renderChart(type, d, opts, blockId) {
  if (!Array.isArray(d) || d.length === 0) {
    return (
      <div className="chart-empty-state">
        <div className="chart-empty-state__icon">📊</div>
        <div className="chart-empty-state__title">No data available</div>
        <div className="chart-empty-state__text">Try a different date range or add chart data.</div>
      </div>
    )
  }

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
  const ax = axisProps(chartFontSize)
  const legend = opts.showLegend ? (
    <Legend
      layout="horizontal"
      verticalAlign="bottom"
      align="center"
      iconType="circle"
      iconSize={9}
      height={34}
      wrapperStyle={{
        bottom: 0,
        left: 0,
        right: 0,
        fontSize: Math.max(9, chartFontSize - 1),
        color: '#475467',
        textAlign: 'center',
        paddingBottom: 2,
      }}
    />
  ) : null
  const grid = opts.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.18)" strokeWidth={1} /> : null
  const topRadius = [chartRadius, chartRadius, 0, 0]

  switch (type) {
    case 'chart-bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Bar dataKey={yKey} fill={opts.color} radius={topRadius} barSize={chartBarSize} />
            {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} radius={topRadius} barSize={chartBarSize} />}
            {extraYKeys.map((k, i) => (
              <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} radius={topRadius} barSize={chartBarSize} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'chart-stacked':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Bar dataKey={yKey} fill={opts.color} stackId="stack" radius={topRadius} barSize={chartBarSize} />
            {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} stackId="stack" radius={topRadius} barSize={chartBarSize} />}
            {extraYKeys.map((k, i) => (
              <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} stackId="stack" radius={topRadius} barSize={chartBarSize} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'chart-line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d} margin={{ top: 10, right: 14, left: 0, bottom: 24 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
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

    case 'chart-area': {
      const gradA = `grad-a-${blockId}`
      const gradB = `grad-b-${blockId}`
      const fillOpacity = Math.max(0.05, Math.min(0.8, opts.areaOpacity / 100))
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
            {legend}
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
    }

    case 'chart-combo':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={d} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Bar dataKey={yKey} fill={opts.color} radius={[8, 8, 0, 0]} barSize={chartBarSize} />
            {yKey2 && (
              <Line type="monotone" dataKey={yKey2} stroke={opts.series2Color} strokeWidth={chartStrokeWidth} dot={opts.showDots ? chartDot(opts.series2Color, chartScale) : false} activeDot={opts.showDots ? { r: Math.max(4, Math.round(4.5 * chartScale)), stroke: '#fff', strokeWidth: 1.5 } : false} />
            )}
            {extraYKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} name={extraYLabels[i]} stroke={extraYColors[i]} strokeWidth={chartStrokeWidth} dot={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )

    case 'chart-stackedarea':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Area type="monotone" dataKey={yKey} stackId="1" stroke={opts.color} fill={opts.color} fillOpacity={0.28} strokeWidth={chartStrokeWidth} />
            {yKey2 && <Area type="monotone" dataKey={yKey2} stackId="1" stroke={opts.series2Color} fill={opts.series2Color} fillOpacity={0.22} strokeWidth={chartStrokeWidth} />}
            {extraYKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} name={extraYLabels[i]} stackId="1" stroke={extraYColors[i]} fill={extraYColors[i]} fillOpacity={0.18} strokeWidth={chartStrokeWidth} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'chart-sparkline':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
            <XAxis dataKey={xKey} hide />
            <YAxis hide />
            <Tooltip {...TOOLTIP_PROPS} />
            <Line type="monotone" dataKey={yKey} stroke={opts.color} strokeWidth={chartStrokeWidth} dot={false} />
          </LineChart>
        </ResponsiveContainer>
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
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={d} cx="50%" cy="45%"
              innerRadius={`${pieInner}%`}
              outerRadius={`${pieOuter}%`}
              dataKey={yKey} nameKey={xKey} label={opts.pieLabel}
            >
              {d.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip {...TOOLTIP_PROPS} />{legend}
          </PieChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-donut': {
      const DONUT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899']
      const total = d.reduce((s, item) => s + (item.value || 0), 0)
      const donutInner = clamp(Math.round(52 * chartScale), 40, 78)
      const donutOuter = clamp(Math.round(85 * chartScale), donutInner + 8, 90)
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 8 }}>
          <div style={{ flex: '0 0 55%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d} cx="50%" cy="50%"
                  innerRadius={`${donutInner}%`} outerRadius={`${donutOuter}%`}
                  dataKey="value" nameKey="label" paddingAngle={2}
                >
                  {d.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip {...TOOLTIP_PROPS} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 8 }}>
            {d.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 10, color: '#475467' }}>{item.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1d2939' }}>{item.value.toLocaleString()}</span>
                <span style={{ fontSize: 9, color: '#98a2b3' }}>({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'chart-radialbar': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      const radial = d.map((r, i) => ({ ...r, name: r[xKey], fill: palette[i % palette.length] }))
      const radialInner = clamp(Math.round(Number(opts.innerRadius ?? 30) * chartScale), 18, 78)
      const radialOuter = clamp(
        Math.max(radialInner + 15, Math.round(Number(opts.outerRadius ?? 55) * chartScale)),
        radialInner + 15,
        90,
      )
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="60%"
            innerRadius={`${radialInner}%`}
            outerRadius={`${radialOuter}%`}
            barSize={Math.max(10, chartBarSize)}
            data={radial}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar minAngle={15} background clockWise dataKey={yKey}
              label={{ position: 'insideStart', fill: '#334155', fontSize: Math.max(9, chartFontSize - 1) }}
            />
            {legend}<Tooltip {...TOOLTIP_PROPS} />
          </RadialBarChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-radar': {
      const radarData = d.map((row) => ({
        ...row,
        screened: Number(row.screened ?? 0),
        positive: Number(row.positive ?? 0),
      }))
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(99,179,237,0.12)" />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: Math.max(9, chartFontSize - 1), fill: '#64748b' }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Radar dataKey={yKey} stroke={opts.color} fill={opts.color} fillOpacity={0.22} />
            {yKey2 && <Radar dataKey={yKey2} stroke={opts.series2Color} fill={opts.series2Color} fillOpacity={0.18} />}
          </RadarChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-scatter': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />{legend}
            <Bar dataKey={yKey} radius={topRadius}>
              {d.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-hbar': {
      const HBAR_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
            {grid}
            <XAxis type="number" tick={ax} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: Math.max(9, chartFontSize - 1), fill: '#475467' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip {...TOOLTIP_PROPS} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={chartBarSize}>
              {d.map((_, i) => <Cell key={i} fill={HBAR_COLORS[i % HBAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
    case 'pivot-table':
    case 'table': {
      const pageSize = 5
      const pageData = d.slice(0, pageSize)
      const totalPages = Math.ceil(d.length / pageSize)
      return (
        <div className="pt-wrap">
          <table className="pt-table" style={{ fontSize: Math.max(9, opts.fontSize - 1) }}>
            <thead><tr>{['Drive Name', 'Location', 'Date', 'Patients Screened', 'Positive Cases', 'Referred', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {pageData.map((p, i) => (
                <tr key={p.id || i}>
                  <td style={{ color: '#1e40af', fontWeight: 500 }}>{p.name}</td>
                  <td>{p.location}</td>
                  <td>{p.date}</td>
                  <td>{p.screened?.toLocaleString()}</td>
                  <td>{p.positive}</td>
                  <td>{p.referred}</td>
                  <td><span style={{ cursor: 'pointer', color: '#64748b' }}>👁</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-pagination">
            <span className="pt-page-info">Showing 1 to {Math.min(pageSize, d.length)} of {d.length} drives</span>
            <div className="pt-page-btns">
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
                <button key={i} className={`pt-page-btn${i === 0 ? ' active' : ''}`}>{i + 1}</button>
              ))}
              {totalPages > 3 && <span className="pt-page-btn">›</span>}
            </div>
          </div>
        </div>
      )
    }

    default:
      return <div style={{ color: '#475569', fontSize: 11, padding: 16 }}>Unknown block type: {type}</div>
  }
}

export default function CanvasBlock({ block, data, selected, onRemove, onDuplicate, onSelect, onUpdateBlock, onDragStart, liveWidth, liveHeight, isPreviewMode = false }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isStatBlock = block.type.startsWith('stat-') || block.type === 'num' || block.type === 'kpi-card'
  const isLayoutBlock = String(block.type || '').startsWith('layout-')
  const isTableBlock = block.type === 'table' || block.type === 'advanced-table' || block.type === 'pivot-table'
  const cardVariant = isStatBlock ? 'stat' : isTableBlock ? 'table' : isLayoutBlock ? 'layout' : 'chart'
  const base = CFG[block.type] || { title: 'Widget', subtitle: '', color: '#64748b' }

  const defaultW = isStatBlock ? 312 : isLayoutBlock ? 360 : 360
  const defaultH = isStatBlock ? 192 : block.type === 'layout-text' ? 140 : block.type === 'layout-image' ? 220 : block.type === 'layout-divider' ? 72 : block.type === 'layout-spacer' ? 120 : isLayoutBlock ? 180 : 384
  const currentW = liveWidth || block.props?.width || defaultW
  const currentH = liveHeight || block.props?.height || defaultH
  const scaleX = Math.max(0.85, Math.min(2.5, currentW / defaultW))
  const scaleY = Math.max(0.85, Math.min(2.5, currentH / defaultH))
  const scale = Math.sqrt(scaleX * scaleY)

  const liveData = useMemo(() => (
    block.props?.data?.length
      ? block.props.data
      : initData(block.type, data)
  ), [block.props?.data, block.type, data])

  const props = useMemo(() => ({
    title: block.props?.title || base.title,
    subtitle: block.props?.subtitle ?? base.subtitle,
    color: block.props?.color || base.color,
    opacity: Number(block.props?.opacity ?? 100),
    radius: Number(block.props?.radius ?? 15),
    showLegend: block.props?.showLegend ?? true,
    showGrid: block.props?.showGrid ?? true,
    showDots: block.props?.showDots ?? true,
    pieLabel: block.props?.pieLabel ?? false,
    fontSize: Math.round(Number(block.props?.fontSize ?? 11) * scale),
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
        boxShadow: selected
          ? `0 0 0 2px ${props.color}, var(--shadow-lg)`
          : hovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        borderColor: selected
          ? props.color
          : hovered ? `${props.color}88` : `${props.color}44`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isPreviewMode ? undefined : onSelect}
    >
      <div className="card-accent" style={{ background: `linear-gradient(90deg,${props.color},${props.color}44)` }} />
      <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', padding: '12px 14px 4px 14px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isPreviewMode && (
            <div className="block-drag-handle" style={{ cursor: 'grab', color: '#cbd5e1', display: 'flex', alignItems: 'center', marginTop: '2px' }} title="Drag to move" onMouseDown={onDragStart}>
              <GripVertical size={14} />
            </div>
          )}
          <div>
            <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="card-title" style={{ fontSize: props.fontSize, fontWeight: 600, color: '#344054', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {props.title}
              </span>
            </div>
            {props.subtitle && <p className="card-subtitle" style={{ fontSize: Math.max(9, props.fontSize - 1), margin: 0, color: '#64748b' }}>{props.subtitle}</p>}
          </div>
        </div>
        <div className="card-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
          {!isPreviewMode && (
            <button className="card-action-btn dup" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} title="More options" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex' }}>
              <MoreVertical size={13} />
            </button>
          )}

          {menuOpen && !isPreviewMode && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
              />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#fff', border: '1px solid #d0d5dd', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 500, minWidth: '140px', display: 'flex', flexDirection: 'column' }}>
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
            </>
          )}
        </div>
      </div>
      <div className={`card-body${isStatBlock ? ' card-body--stat' : ''}`}>
        {isStatBlock
          ? renderStatBlock(block.type, data, props)
          : String(block.type || '').startsWith('layout-')
            ? renderLayoutBlock(block.type, props)
            : renderChart(block.type, liveData, props, block.id)
        }
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
