import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Hash, Trash2 } from 'lucide-react'

const CHART_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#f97316', '#a78bfa',
  '#ef4444', '#34d399', '#fbbf24', '#60a5fa',
]

const BLOCK_NAMES = {
  'chart-bar':      'Bar Chart',
  'chart-stacked':  'Stacked Bar',
  'chart-line':     'Line Chart',
  'chart-area':     'Area Chart',
  'chart-pie':      'Pie Chart',
  'chart-donut':    'Donut Chart',
  'chart-radialbar':'Radial Bar',
  'chart-scatter':  'Age Groups',
  num:              'Stat Block',
  table:            'Patient Table',
  'stat-total':     'Number Callout',
  'stat-positive':  'Number Callout',
  'stat-normal':    'Number Callout',
  'stat-oral':      'Number Callout',
  'stat-anemia':    'Number Callout',
  'stat-locations': 'Number Callout',
  'stat-tests':     'Number Callout',
}

const WIDGET_DESCRIPTIONS = {
  'stat-total':     'Displays a key metric or KPI',
  'stat-positive':  'Displays a key metric or KPI',
  'stat-normal':    'Displays a key metric or KPI',
  'stat-oral':      'Displays a key metric or KPI',
  'stat-anemia':    'Displays a key metric or KPI',
  'stat-locations': 'Displays a key metric or KPI',
  'stat-tests':     'Displays a key metric or KPI',
  'chart-bar':      'Displays data as vertical bars',
  'chart-line':     'Displays data as a line trend',
  'chart-donut':    'Displays data distribution as a donut',
  'chart-pie':      'Displays data distribution as a pie',
  table:            'Displays data in a tabular format',
}

const DEFAULT_PROPS = {
  title: '', subtitle: '',
  color: '#06b6d4', colSpan: 1, height: 420,
  showLegend: true, showGrid: true, showDots: true, pieLabel: false,
  fontSize: 11, radius: 15, opacity: 100,
  fontFamily: 'Plus Jakarta Sans', fontWeight: 'Regular (400)',
  xKey: '', yKey: '', yKey2: '', extraYKeys: [],
  extraYColors: [], extraYLabels: [],
  strokeWidth: 2, barRadius: 4,
  innerRadius: 30, outerRadius: 55, barSize: 12,
  areaOpacity: 30, series2Color: '#ef4444',
}

function isStatType(type) { return type?.startsWith('stat-') }

function Section({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="prop-section-accordion">
      <button className="prop-section-accordion-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
      </button>
      {open && <div className="prop-section-accordion-body">{children}</div>}
    </div>
  )
}

export default function LeftPanel({
  side = 'left',
  open, selectedBlock, selectedSection,
  cols,
  onUpdateBlock,
  onUpdateSection,
  onClose,
}) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(DEFAULT_PROPS.color)
  const [showComparison, setShowComparison] = useState(true)
  const [comparisonFormat, setComparisonFormat] = useState('Percentage')
  const [comparisonPeriod, setComparisonPeriod] = useState('Previous Period')
  const [iconColor, setIconColor] = useState('#1e40af')
  const [numberFormat, setNumberFormat] = useState('1,234')

  const selectedId = selectedBlock?.id

  useEffect(() => {
    if (!selectedBlock) return
    const props = { ...DEFAULT_PROPS, ...selectedBlock.props }
    setTitle(props.title || '')
    setColor(props.color || DEFAULT_PROPS.color)
  }, [selectedId])

  if (!selectedBlock) {
    return (
      <aside className={`${side}-panel properties-panel${open ? '' : ' collapsed'}`}>
        <div className="panel-header">
          <span className="panel-title">Widget Properties</span>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>
        <div className="no-selection">
          <div className="no-selection-icon"><Hash size={28} /></div>
          <p className="no-selection-text">Select a widget on the canvas to edit its properties here</p>
        </div>
      </aside>
    )
  }

  const widgetType = BLOCK_NAMES[selectedBlock.type] || 'Widget'
  const widgetDesc = WIDGET_DESCRIPTIONS[selectedBlock.type] || ''
  const isStat = isStatType(selectedBlock.type)

  return (
    <aside className={`${side}-panel properties-panel${open ? '' : ' collapsed'}`}>
      <div className="panel-header">
        <span className="panel-title">Widget Properties</span>
        <button className="panel-close" onClick={onClose}>×</button>
      </div>

      <div className="panel-body">
        {/* Widget Type */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Widget Type</div>
          <div className="wp-widget-type-plain">
            <div className="wp-widget-type-icon-green">
              <Hash size={14} color="#fff" />
            </div>
            <div>
              <div className="wp-widget-type-name">{widgetType}</div>
              <div className="wp-widget-type-desc">{widgetDesc}</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Title</div>
          <input
            className="wp-input"
            value={title}
            onChange={(e) => { setTitle(e.target.value); onUpdateBlock({ title: e.target.value }) }}
            placeholder="Widget title"
          />
        </div>

        {/* Data Source */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Data Source</div>
          <select className="wp-select">
            <option>Patient Screening Summary</option>
          </select>
        </div>

        {/* Metric / Value */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Metric / Value</div>
          <select className="wp-select">
            <option>Total Patients Screened</option>
            <option>Tests Conducted</option>
            <option>Positive Cases</option>
            <option>Referred</option>
          </select>
        </div>

        {/* Comparison */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Comparison</div>
          <select className="wp-select" value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value)}>
            <option>Previous Period</option>
            <option>Previous Month</option>
            <option>Previous Year</option>
          </select>

          <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
            <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show comparison</span>
            <div className={`prop-toggle${showComparison ? ' on' : ''}`} onClick={() => setShowComparison(!showComparison)} />
          </div>

          <div>
            <div className="wp-label">Comparison format</div>
            <select className="wp-select" value={comparisonFormat} onChange={(e) => setComparisonFormat(e.target.value)}>
              <option>Percentage</option>
              <option>Absolute</option>
            </select>
          </div>
        </div>

        {/* Icon & Icon Color */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Icon</div>
              <div className="wp-row">
                <div className="wp-icon-preview-blue">
                  <Hash size={14} color="#fff" />
                </div>
                <button className="wp-change-btn">Change</button>
              </div>
            </div>
            <div>
              <div className="wp-label">Icon color</div>
              <div
                className="wp-color-swatch-blue"
                onClick={() => setIconColor(iconColor === '#1e40af' ? '#3b82f6' : '#1e40af')}
              />
            </div>
          </div>
        </div>

        {/* Number Format */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Number Format</div>
              <select className="wp-select" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)}>
                <option>1,234</option>
                <option>1234</option>
                <option>1.2K</option>
              </select>
            </div>
            <div>
              <div className="wp-label">Suffix (optional)</div>
              <input className="wp-input" placeholder="" />
            </div>
          </div>
        </div>

        {/* Color for increase / decrease */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Color for increase</div>
              <div className="wp-color-swatch-green" />
            </div>
            <div>
              <div className="wp-label">Color for decrease</div>
              <div className="wp-color-swatch-red" />
            </div>
          </div>
        </div>

        <div style={{ height: '8px' }}></div>

        {/* Collapsible sections */}
        <Section title="Filters">
          <p className="wp-placeholder-text">No filters configured</p>
        </Section>

        <Section title="Conditional Formatting">
          <p className="wp-placeholder-text">No rules configured</p>
        </Section>

        <Section title="Advanced Options">
          <p className="wp-placeholder-text">No advanced options available</p>
        </Section>

        {/* Delete Widget */}
        <div className="wp-section" style={{ borderBottom: 'none' }}>
          <button className="wp-delete-btn-flat" onClick={() => onClose?.()}>
            <Trash2 size={14} />
            Delete Widget
          </button>
        </div>
      </div>
    </aside>
  )
}
