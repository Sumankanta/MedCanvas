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
  'chart-combo':    'Combo Chart',
  'chart-stackedarea': 'Stacked Area',
  'chart-sparkline':'Sparkline',
  'chart-radar':    'Radar Chart',
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
  'chart-combo':    'Displays bars with an overlay trend line',
  'chart-stackedarea': 'Displays layered area trends',
  'chart-sparkline':'Displays a compact trend summary',
  'chart-radar':    'Displays a multi-metric profile',
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
  onRemoveBlock,
}) {
  const selectedId = selectedBlock?.id
  const props = selectedBlock ? { ...DEFAULT_PROPS, ...selectedBlock.props } : null

  if (!selectedBlock || !props) {
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

  const handleUpdate = (patch) => {
    onUpdateBlock(patch)
  }

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
            value={props.title || ''}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            placeholder="Widget title"
          />
        </div>

        {/* Subtitle */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Subtitle</div>
          <input
            className="wp-input"
            value={props.subtitle || ''}
            onChange={(e) => handleUpdate({ subtitle: e.target.value })}
            placeholder="Widget subtitle"
          />
        </div>

        {/* Primary Color */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Color</div>
              <input
                type="color"
                className="wp-input"
                style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                value={props.color || '#06b6d4'}
                onChange={(e) => handleUpdate({ color: e.target.value })}
              />
            </div>
            <div>
               <div className="wp-label">Secondary Color</div>
              <input
                type="color"
                className="wp-input"
                style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                value={props.series2Color || '#ef4444'}
                onChange={(e) => handleUpdate({ series2Color: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Options</div>
          
          <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
            <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show Legend</span>
            <div className={`prop-toggle${props.showLegend ? ' on' : ''}`} onClick={() => handleUpdate({ showLegend: !props.showLegend })} />
          </div>

          <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
            <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show Grid</span>
            <div className={`prop-toggle${props.showGrid ? ' on' : ''}`} onClick={() => handleUpdate({ showGrid: !props.showGrid })} />
          </div>

          <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
            <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show Dots (Line)</span>
            <div className={`prop-toggle${props.showDots ? ' on' : ''}`} onClick={() => handleUpdate({ showDots: !props.showDots })} />
          </div>
        </div>

        {/* Design Options */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Font Size</div>
              <input
                type="number"
                className="wp-input"
                value={props.fontSize || 11}
                onChange={(e) => handleUpdate({ fontSize: Math.max(1, parseInt(e.target.value) || 11) })}
              />
            </div>
            <div>
              <div className="wp-label">Border Radius</div>
              <input
                 type="number"
                className="wp-input"
                value={props.radius || 15}
                onChange={(e) => handleUpdate({ radius: Math.max(0, parseInt(e.target.value) || 0) })}
              />
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
          <button className="wp-delete-btn-flat" onClick={() => onRemoveBlock?.()}>
            <Trash2 size={14} />
            Delete Widget
          </button>
        </div>
      </div>
    </aside>
  )
}
