import { useState } from 'react'
import {
  Activity,
  BarChart3,
  ChartColumnStacked,
  ChartNoAxesColumnIncreasing,
  Donut,
  Funnel,
  Gauge,
  GripVertical,
  LineChart,
  PieChart,
  ScatterChart,
  Table2,
  Users,
  HeartPulse,
  CheckCircle,
  Stethoscope,
  Droplets,
  MapPin,
  FlaskConical,
} from 'lucide-react'

const CHART_BLOCKS = [
  { type: 'chart-bar',      name: 'Bar Chart',     desc: 'Compare categories',    Icon: BarChart3,                  color: '#3b82f6' },
  { type: 'chart-line',     name: 'Line Chart',    desc: 'Trends over time',      Icon: LineChart,                  color: '#10b981' },
  { type: 'chart-area',     name: 'Area Chart',    desc: 'Filled trend view',     Icon: ChartNoAxesColumnIncreasing,color: '#06b6d4' },
  { type: 'chart-pie',      name: 'Pie Chart',     desc: 'Part-to-whole',         Icon: PieChart,                   color: '#f59e0b' },
  { type: 'chart-donut',    name: 'Donut Chart',   desc: 'Pie with centre text',  Icon: Donut,                      color: '#ec4899' },
  { type: 'chart-stacked',  name: 'Stacked Bar',   desc: 'Multi-series stacked',  Icon: ChartColumnStacked,         color: '#8b5cf6' },
  { type: 'chart-radialbar',name: 'Radial Bar',    desc: 'Progress by segment',   Icon: Gauge,                      color: '#f97316' },
  { type: 'chart-scatter',  name: 'Age Groups',    desc: 'Distribution chart',    Icon: ScatterChart,               color: '#a78bfa' },
  { type: 'num',            name: 'KPI Cards',     desc: 'Key stat numbers',      Icon: Activity,                   color: '#34d399' },
  { type: 'table',          name: 'Patient Table', desc: 'Records list',          Icon: Table2,                     color: '#94a3b8' },
  { type: 'chart-bar',      name: 'Funnel Chart',  desc: 'Stage progression',     Icon: Funnel,                     color: '#ef4444' },
  { type: 'chart-pie',      name: 'Progress Ring', desc: 'Circular progress',     Icon: Donut,                      color: '#06b6d4' },
  { type: 'chart-line',     name: 'Timeline',      desc: 'Events over time',      Icon: LineChart,                  color: '#f59e0b' },
]

const STAT_BLOCKS = [
  {
    type:  'stat-total',
    name:  'Total Patients',
    desc:  'All screened patients',
    Icon:  Users,
    color: '#06b6d4',
    bg:    'rgba(6,182,212,0.1)',
  },
  {
    type:  'stat-positive',
    name:  'Total Positive',
    desc:  'All positive cases',
    Icon:  HeartPulse,
    color: '#ef4444',
    bg:    'rgba(239,68,68,0.1)',
  },
  {
    type:  'stat-normal',
    name:  'Normal / Clear',
    desc:  'Patients cleared',
    Icon:  CheckCircle,
    color: '#10b981',
    bg:    'rgba(16,185,129,0.1)',
  },
  {
    type:  'stat-oral',
    name:  'Oral Cancer +ve',
    desc:  'Oral cancer positives',
    Icon:  Stethoscope,
    color: '#f97316',
    bg:    'rgba(249,115,22,0.1)',
  },
  {
    type:  'stat-anemia',
    name:  'Anemia +ve',
    desc:  'Anemia positive cases',
    Icon:  Droplets,
    color: '#ec4899',
    bg:    'rgba(236,72,153,0.1)',
  },
  {
    type:  'stat-locations',
    name:  'Camp Locations',
    desc:  'Active camp sites',
    Icon:  MapPin,
    color: '#8b5cf6',
    bg:    'rgba(139,92,246,0.1)',
  },
  {
    type:  'stat-tests',
    name:  'Tests Conducted',
    desc:  'Total tests run',
    Icon:  FlaskConical,
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.1)',
  },
]

function ChartPreview({ type, color }) {
  if (type === 'chart-line' || type === 'chart-area') {
    return (
      <svg className="chart-preview-svg" viewBox="0 0 88 40" aria-hidden="true">
        {type === 'chart-area' && <path d="M4 34 L4 24 L24 12 L42 18 L63 8 L84 22 L84 34 Z" fill={`${color}44`} />}
        <polyline points="4,24 24,12 42,18 63,8 84,22" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'chart-pie' || type === 'chart-donut') {
    return <div className={`chart-preview-pie ${type === 'chart-donut' ? 'donut' : ''}`} style={{ '--preview-color': color }} />
  }
  if (type === 'chart-radialbar') {
    return <div className="chart-preview-radial" style={{ '--preview-color': color }} />
  }
  if (type === 'num') {
    return (
      <div className="chart-preview-kpi">
        <div className="preview-kpi-cell" style={{ borderColor: `${color}66` }} />
        <div className="preview-kpi-cell" style={{ borderColor: `${color}66` }} />
        <div className="preview-kpi-cell" style={{ borderColor: `${color}66` }} />
        <div className="preview-kpi-cell" style={{ borderColor: `${color}66` }} />
      </div>
    )
  }
  if (type === 'table') {
    return (
      <div className="chart-preview-table">
        <span /><span /><span />
      </div>
    )
  }
  return (
    <div className="chart-preview-bars">
      {[14, 27, 20, 30, 17].map((h, i) => (
        <span key={i} style={{ height: h, background: i % 2 === 0 ? color : `${color}77` }} />
      ))}
    </div>
  )
}

function StatBlockCard({ block, onAddBlock }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('blockType', block.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      className="stat-block-card"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAddBlock(block.type)}
      style={{ '--stat-color': block.color, '--stat-bg': block.bg }}
    >
      <div className="stat-block-icon">
        <block.Icon size={15} />
      </div>
      <div className="stat-block-text">
        <div className="stat-block-name">{block.name}</div>
        <div className="stat-block-desc">{block.desc}</div>
      </div>
      <span className="stat-block-drag"><GripVertical size={13} /></span>
    </div>
  )
}

export default function RightPanel({ open = true, variables, onAddBlock }) {
  const [tab, setTab] = useState('charts')

  function handleDragStart(e, type) {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className={`right-panel${open ? '' : ' collapsed'}`}>
      <div className="rp-tabs">
        <button className={`rp-tab${tab === 'charts' ? ' active' : ''}`} onClick={() => setTab('charts')}>Charts</button>
        <button className={`rp-tab${tab === 'stats'  ? ' active' : ''}`} onClick={() => setTab('stats')}>Stats</button>
        <button className={`rp-tab${tab === 'vars'   ? ' active' : ''}`} onClick={() => setTab('vars')}>Vars</button>
      </div>

      <div className="rp-body">

        {/* ── CHARTS TAB ── */}
        {tab === 'charts' && (
          <>
            <div className="rp-section-label">Drag or click to add</div>
            {CHART_BLOCKS.map((block, i) => (
              <div
                key={`${block.name}-${i}`}
                className="chart-card"
                draggable
                onDragStart={(e) => handleDragStart(e, block.type)}
                onClick={() => onAddBlock(block.type)}
              >
                <div className="chart-thumb" style={{ background: `${block.color}18`, borderColor: `${block.color}35` }}>
                  <block.Icon size={16} />
                </div>
                <div className="chart-card-text">
                  <div className="chart-card-name">{block.name}</div>
                  <div className="chart-card-desc">{block.desc}</div>
                </div>
                <span className="chart-card-drag"><GripVertical size={13} /></span>
                <div className="chart-preview-thumb">
                  <ChartPreview type={block.type} color={block.color} />
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <>
            <div className="rp-section-label">Drag or click to add</div>
            <p className="rp-section-hint">
              Single-value stat cards — perfect for KPIs at a glance.
            </p>
            {STAT_BLOCKS.map((block) => (
              <StatBlockCard key={block.type} block={block} onAddBlock={onAddBlock} />
            ))}
          </>
        )}

        {/* ── VARS TAB ── */}
        {tab === 'vars' && (
          <>
            <div className="rp-section-label">Live Drive Variables</div>
            {variables?.map((v) => (
              <div key={v.key} className="var-row">
                <span className="var-label">{v.label}</span>
                <span className="var-value">{v.value.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px', background: 'rgba(6,182,212,0.05)', borderRadius: 9, border: '1px solid rgba(6,182,212,0.12)' }}>
              <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.6 }}>
                Variables auto-update every 30s. Connect Spring Boot API to replace mock data.
              </p>
            </div>
          </>
        )}

      </div>
    </aside>
  )
}