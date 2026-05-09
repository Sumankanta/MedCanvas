import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts'
import { Copy, Pencil, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const BASE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#a78bfa']
const TOOLTIP_PROPS = {
  contentStyle: { background: '#0a1628', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 8, fontSize: 11 },
  itemStyle: { color: '#94a3b8' },
}

const STAT_META = {
  'stat-total':     { dataKey: 'totalScreened',  label: 'Total Patients Screened', icon: '👥', defaultColor: '#06b6d4', trend: +8  },
  'stat-positive':  { dataKey: 'oralCancer',      label: 'Total Positive Cases',    icon: '🩺', defaultColor: '#ef4444', trend: -3  },
  'stat-normal':    { dataKey: 'normal',           label: 'Normal / Clear',          icon: '✅', defaultColor: '#10b981', trend: +12 },
  'stat-oral':      { dataKey: 'oralCancer',       label: 'Oral Cancer +ve',         icon: '🦷', defaultColor: '#f97316', trend: -2  },
  'stat-anemia':    { dataKey: 'anemia',           label: 'Anemia +ve',              icon: '💉', defaultColor: '#ec4899', trend: +5  },
  'stat-locations': { dataKey: 'locations',        label: 'Camp Locations',          icon: '📍', defaultColor: '#8b5cf6', trend: 0   },
  'stat-tests':     { dataKey: 'testsTotal',       label: 'Tests Conducted',         icon: '🔬', defaultColor: '#f59e0b', trend: +15 },
}

const CFG = {
  'chart-bar':      { title: 'Screenings by Day',   subtitle: 'Daily breakdown',       color: '#3b82f6' },
  'chart-stacked':  { title: 'Stacked Results',     subtitle: 'Positive vs normal',    color: '#8b5cf6' },
  'chart-line':     { title: 'Screening Trend',     subtitle: 'Week overview',         color: '#10b981' },
  'chart-area':     { title: 'Area Trend',           subtitle: 'Cumulative view',       color: '#06b6d4' },
  'chart-pie':      { title: 'Screening Outcomes',  subtitle: 'Result distribution',   color: '#f59e0b' },
  'chart-donut':    { title: 'Test Type Split',      subtitle: 'By test category',      color: '#ec4899' },
  'chart-radialbar':{ title: 'Camp Progress',        subtitle: 'Screened per camp',     color: '#f97316' },
  'chart-scatter':  { title: 'Age Distribution',    subtitle: 'By age group',          color: '#a78bfa' },
  num:              { title: 'Key Statistics',       subtitle: 'Live drive numbers',    color: '#34d399' },
  table:            { title: 'Patient Records',      subtitle: 'Screening data',        color: '#94a3b8' },
  'stat-total':     { title: 'Total Patients',       subtitle: 'Screened this drive',   color: '#06b6d4' },
  'stat-positive':  { title: 'Positive Cases',       subtitle: 'Requires follow-up',    color: '#ef4444' },
  'stat-normal':    { title: 'Normal / Clear',       subtitle: 'No issues detected',    color: '#10b981' },
  'stat-oral':      { title: 'Oral Cancer +ve',      subtitle: 'Oral cancer positives', color: '#f97316' },
  'stat-anemia':    { title: 'Anemia +ve',           subtitle: 'Anemia positive cases', color: '#ec4899' },
  'stat-locations': { title: 'Camp Locations',       subtitle: 'Active sites',          color: '#8b5cf6' },
  'stat-tests':     { title: 'Tests Conducted',      subtitle: 'Total tests run',       color: '#f59e0b' },
}

function axisProps(fontSize) {
  return { fontSize: Math.max(8, fontSize - 1), fill: '#64748b' }
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
      return { x: ['day'], y: ['screened', 'positive', 'normal'], hasSecondary: true }
    case 'chart-stacked':
      return { x: ['day'], y: ['normal', 'positive', 'screened'], hasSecondary: true }
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
  const meta = STAT_META[type]
  if (!meta) return null
  const varEntry = data?.statVariables?.find((v) => v.key === meta.dataKey)
  const value = varEntry?.value ?? 0
  const color = props.color
  const trend = meta.trend
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b'
  const total = data?.statVariables?.find((v) => v.key === 'totalScreened')?.value ?? 1
  const pct = type === 'stat-total' ? 100 : Math.round((value / total) * 100)

  return (
    <div className="stat-block-render" style={{ '--sb-color': color }}>
      <div className="sb-top">
        <div className="sb-icon-wrap" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
          <span className="sb-emoji">{meta.icon}</span>
        </div>
        <div className="sb-value-wrap">
          <span className="sb-value" style={{ color, fontSize: Math.max(28, props.fontSize + 20), fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
            {value.toLocaleString()}
          </span>
          <div className="sb-trend" style={{ color: trendColor }}>
            <TrendIcon size={11} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>
              {trend === 0 ? 'No change' : `${trend > 0 ? '+' : ''}${trend}% vs last drive`}
            </span>
          </div>
        </div>
      </div>
      <div className="sb-progress-wrap">
        <div className="sb-progress-track">
          <div className="sb-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        </div>
        <span className="sb-progress-label" style={{ color: `${color}cc` }}>
          {type === 'stat-total' ? '100% of drive' : `${pct}% of total`}
        </span>
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
      return clone(data.screeningByDayData)
    case 'chart-pie':    return clone(data.outcomeChartData)
    case 'chart-donut':  return clone(data.testTypeData.map((d) => ({ label: d.name, value: d.value })))
    case 'chart-radialbar': return clone(data.campLocationData)
    case 'chart-scatter':   return clone(data.ageGroupData)
    case 'num':   return clone(data.statVariables)
    case 'table': return clone(data.patientTableData)
    default:      return []
  }
}

// ── renderChart now accepts extraYColors + extraYLabels ──────────────────────
function renderChart(type, d, opts, blockId) {
  const mapping = seriesOptions(type)
  const xKey  = pickOrDefault(mapping.x, opts.xKey)
  const yKey  = pickOrDefault(mapping.y, opts.yKey)
  const yKey2 = mapping.hasSecondary ? pickOrDefault(mapping.y, opts.yKey2 || mapping.y[1]) : ''

  const extraYKeys   = Array.isArray(opts.extraYKeys)   ? opts.extraYKeys.filter((k) => mapping.y.includes(k) && k !== yKey && k !== yKey2) : []
  // Per-field colors: fall back to BASE_COLORS if not set
  const extraYColors = Array.isArray(opts.extraYColors) && opts.extraYColors.length === opts.extraYKeys?.length
    ? opts.extraYColors
    : extraYKeys.map((_, i) => BASE_COLORS[(i + 2) % BASE_COLORS.length])
  // Per-field labels for legend: fall back to key name
  const extraYLabels = Array.isArray(opts.extraYLabels) && opts.extraYLabels.length === opts.extraYKeys?.length
    ? opts.extraYLabels
    : extraYKeys.map((k) => k)

  const ax     = axisProps(opts.fontSize)
  const legend = opts.showLegend ? <Legend wrapperStyle={{ fontSize: Math.max(9, opts.fontSize - 1) }} /> : null
  const grid   = opts.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" /> : null
  const topRadius = [opts.barRadius, opts.barRadius, 0, 0]

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
            <Bar dataKey={yKey}  fill={opts.color}        radius={topRadius} />
            {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} radius={topRadius} />}
            {extraYKeys.map((k, i) => (
              <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} radius={topRadius} />
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
            <Bar dataKey={yKey}  fill={opts.color}        stackId="stack" radius={topRadius} />
            {yKey2 && <Bar dataKey={yKey2} fill={opts.series2Color} stackId="stack" radius={topRadius} />}
            {extraYKeys.map((k, i) => (
              <Bar key={k} dataKey={k} name={extraYLabels[i]} fill={extraYColors[i]} stackId="stack" radius={topRadius} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'chart-line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Line type="monotone" dataKey={yKey}  stroke={opts.color}        strokeWidth={opts.strokeWidth} dot={opts.showDots ? { r: 3, fill: opts.color }        : false} />
            {yKey2 && <Line type="monotone" dataKey={yKey2} stroke={opts.series2Color} strokeWidth={opts.strokeWidth} dot={opts.showDots ? { r: 3, fill: opts.series2Color } : false} />}
            {extraYKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} name={extraYLabels[i]}
                stroke={extraYColors[i]} strokeWidth={opts.strokeWidth}
                dot={opts.showDots ? { r: 3, fill: extraYColors[i] } : false}
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
                <stop offset="5%"  stopColor={opts.color}        stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={opts.color}        stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={gradB} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={opts.series2Color} stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={opts.series2Color} stopOpacity={0.02} />
              </linearGradient>
              {extraYKeys.map((_, i) => (
                <linearGradient key={i} id={`grad-extra-${blockId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={extraYColors[i]} stopOpacity={fillOpacity} />
                  <stop offset="95%" stopColor={extraYColors[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {grid}
            <XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false} />
            <YAxis tick={ax} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} />
            {legend}
            <Area type="monotone" dataKey={yKey}  stroke={opts.color}        fill={`url(#${gradA})`} strokeWidth={opts.strokeWidth} />
            {yKey2 && <Area type="monotone" dataKey={yKey2} stroke={opts.series2Color} fill={`url(#${gradB})`} strokeWidth={opts.strokeWidth} />}
            {extraYKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} name={extraYLabels[i]}
                stroke={extraYColors[i]}
                fill={`url(#grad-extra-${blockId}-${i})`}
                strokeWidth={opts.strokeWidth}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-pie': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={d} cx="50%" cy="45%"
              innerRadius={`${Math.max(0, opts.innerRadius)}%`}
              outerRadius={`${Math.max(opts.innerRadius + 5, opts.outerRadius)}%`}
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
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={d} cx="50%" cy="45%"
              innerRadius={`${Math.max(10, opts.innerRadius)}%`}
              outerRadius={`${Math.max(opts.innerRadius + 8, opts.outerRadius)}%`}
              dataKey={yKey} nameKey={xKey} label={opts.pieLabel}
            >
              {d.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip {...TOOLTIP_PROPS} />{legend}
          </PieChart>
        </ResponsiveContainer>
      )
    }

    case 'chart-radialbar': {
      const palette = [opts.color, opts.series2Color, ...extraYColors, ...BASE_COLORS]
      const radial = d.map((r, i) => ({ ...r, name: r[xKey], fill: palette[i % palette.length] }))
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%"
            innerRadius={`${Math.max(5, opts.innerRadius)}%`}
            outerRadius={`${Math.max(opts.innerRadius + 15, opts.outerRadius)}%`}
            barSize={opts.barSize} data={radial} startAngle={180} endAngle={0}
          >
            <RadialBar minAngle={15} background clockWise dataKey={yKey}
              label={{ position: 'insideStart', fill: '#64748b', fontSize: Math.max(8, opts.fontSize - 2) }}
            />
            {legend}<Tooltip {...TOOLTIP_PROPS} />
          </RadialBarChart>
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

    case 'table':
      return (
        <div className="pt-wrap">
          <table className="pt-table" style={{ fontSize: Math.max(9, opts.fontSize - 1) }}>
            <thead><tr>{['ID', 'Name', 'Age', 'Test', 'Outcome', 'Camp'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {d.map((p, i) => (
                <tr key={p.id || i}>
                  <td style={{ color: '#475569' }}>{p.id}</td>
                  <td style={{ color: '#cbd5e1' }}>{p.name}</td>
                  <td>{p.age}</td><td>{p.test}</td>
                  <td><span className={`outcome-pill ${p.outcome === 'positive' ? 'pos' : 'norm'}`}>{p.outcome}</span></td>
                  <td>{p.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return <div style={{ color: '#475569', fontSize: 11, padding: 16 }}>Unknown block type</div>
  }
}

export default function CanvasBlock({ block, data, selected, onRemove, onDuplicate, onSelect, onUpdateBlock }) {
  const [hovered,   setHovered]   = useState(false)
  const [editing,   setEditing]   = useState(false)
  const [localData, setLocalData] = useState(() => block.props?.data || initData(block.type, data))

  const isStatBlock = block.type.startsWith('stat-')
  const base = CFG[block.type] || { title: 'Widget', subtitle: '', color: '#64748b' }

  const props = useMemo(() => ({
    title:        block.props?.title       || base.title,
    subtitle:     block.props?.subtitle    ?? base.subtitle,
    color:        block.props?.color       || base.color,
    opacity:      Number(block.props?.opacity    ?? 100),
    radius:       Number(block.props?.radius     ?? 15),
    showLegend:   block.props?.showLegend  ?? true,
    showGrid:     block.props?.showGrid    ?? true,
    showDots:     block.props?.showDots    ?? true,
    pieLabel:     block.props?.pieLabel    ?? false,
    fontSize:     Number(block.props?.fontSize   ?? 11),
    fontFamily:   block.props?.fontFamily  || 'Plus Jakarta Sans',
    fontWeight:   toWeight(block.props?.fontWeight || 'Regular (400)'),
    xKey:         block.props?.xKey        || '',
    yKey:         block.props?.yKey        || '',
    yKey2:        block.props?.yKey2       || '',
    extraYKeys:   Array.isArray(block.props?.extraYKeys)   ? block.props.extraYKeys   : [],
    extraYColors: Array.isArray(block.props?.extraYColors) ? block.props.extraYColors : [],
    extraYLabels: Array.isArray(block.props?.extraYLabels) ? block.props.extraYLabels : [],
    strokeWidth:  Number(block.props?.strokeWidth ?? 2),
    barRadius:    Number(block.props?.barRadius   ?? 4),
    innerRadius:  Number(block.props?.innerRadius ?? 30),
    outerRadius:  Number(block.props?.outerRadius ?? 55),
    barSize:      Number(block.props?.barSize     ?? 12),
    areaOpacity:  Number(block.props?.areaOpacity ?? 30),
    series2Color: block.props?.series2Color || '#ef4444',
  }), [block.props, base.color, base.subtitle, base.title])

  return (
    <div
      className="canvas-card"
      style={{
        height:       '100%',
        opacity:      props.opacity / 100,
        borderRadius: props.radius,
        fontFamily:   props.fontFamily,
        boxShadow:    selected
          ? `0 0 0 2px ${props.color}, var(--shadow-lg)`
          : hovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        borderColor:  selected
          ? props.color
          : hovered ? `${props.color}88` : `${props.color}44`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div className="card-accent" style={{ background: `linear-gradient(90deg,${props.color},${props.color}44)` }} />
      <div className="card-header">
        <div>
          <div className="card-title-row">
            <div className="card-dot" style={{ background: props.color, boxShadow: `0 0 5px ${props.color}` }} />
            <span className="card-title" style={{ fontSize: props.fontSize, fontWeight: props.fontWeight }}>{props.title}</span>
          </div>
          <p className="card-subtitle" style={{ fontSize: Math.max(9, props.fontSize - 1) }}>{props.subtitle}</p>
        </div>
        <div className="card-actions">
          {!isStatBlock && (
            <button className="card-action-btn edit" onClick={(e) => { e.stopPropagation(); setEditing(true) }} title="Edit data">
              <Pencil size={11} />
            </button>
          )}
          <button className="card-action-btn dup"    onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicate"><Copy size={11} /></button>
          <button className="card-action-btn remove" onClick={(e) => { e.stopPropagation(); onRemove()    }} title="Remove"   ><X    size={11} /></button>
        </div>
      </div>
      <div className={`card-body${isStatBlock ? ' card-body--stat' : ''}`}>
        {isStatBlock
          ? renderStatBlock(block.type, data, props)
          : renderChart(block.type, localData, props, block.id)
        }
        {editing && !isStatBlock && (
          <DataEditor
            block={block}
            rows={localData}
            onSave={(rows) => { 
              setLocalData(rows); 
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