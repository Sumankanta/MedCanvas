import { useState } from 'react'
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
  color: '#06b6d4', colSpan: 1, width: 360, height: 420,
  showLegend: true, showGrid: true, showDots: true, pieLabel: false,
  fontSize: 11, chartScale: 100, radius: 15, opacity: 100,
  fontFamily: 'Plus Jakarta Sans', fontWeight: 'Regular (400)',
  xKey: '', yKey: '', yKey2: '', extraYKeys: [],
  extraYColors: [], extraYLabels: [],
  strokeWidth: 2, barRadius: 4,
  innerRadius: 30, outerRadius: 55, barSize: 12,
  areaOpacity: 30, series2Color: '#ef4444',
}

const FONT_FAMILIES = [
  'Plus Jakarta Sans',
  'Inter',
  'System UI',
  'Georgia',
  'Roboto',
]

const FONT_WEIGHTS = [
  'Regular (400)',
  'Medium (500)',
  'Semibold (600)',
  'Bold (700)',
]

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
  const isChart = selectedBlock.type?.startsWith('chart-')

  const handleUpdate = (patch) => {
    onUpdateBlock(patch)
  }

  const clampNumber = (value, min, max, fallback) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return fallback
    return Math.max(min, Math.min(max, parsed))
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

        <Section title="Layout" defaultOpen>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Width</div>
              <input
                type="number"
                className="wp-input"
                value={props.width || 360}
                onChange={(e) => handleUpdate({ width: clampNumber(e.target.value, 180, 1400, 360) })}
              />
            </div>
            <div>
              <div className="wp-label">Height</div>
              <input
                type="number"
                className="wp-input"
                value={props.height || 420}
                onChange={(e) => handleUpdate({ height: clampNumber(e.target.value, 120, 1200, 420) })}
              />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="wp-label">Opacity</div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              className="wp-range"
              value={props.opacity || 100}
              onChange={(e) => handleUpdate({ opacity: clampNumber(e.target.value, 20, 100, 100) })}
            />
            <div className="wp-range-meta">
              <span>Transparent</span>
              <span>{props.opacity || 100}%</span>
              <span>Solid</span>
            </div>
          </div>
        </Section>

        <Section title="Typography" defaultOpen={false}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">Font Family</div>
              <select
                className="wp-input"
                value={props.fontFamily || 'Plus Jakarta Sans'}
                onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
              >
                {FONT_FAMILIES.map((family) => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="wp-label">Font Weight</div>
              <select
                className="wp-input"
                value={props.fontWeight || 'Regular (400)'}
                onChange={(e) => handleUpdate({ fontWeight: e.target.value })}
              >
                {FONT_WEIGHTS.map((weight) => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {isChart && (
          <Section title="Chart Styling" defaultOpen>
            <div className="wp-grid-2">
              <div>
                <div className="wp-label">Stroke Width</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.strokeWidth || 2}
                  onChange={(e) => handleUpdate({ strokeWidth: clampNumber(e.target.value, 1, 12, 2) })}
                />
              </div>
              <div>
                <div className="wp-label">Bar Size</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.barSize || 12}
                  onChange={(e) => handleUpdate({ barSize: clampNumber(e.target.value, 6, 40, 12) })}
                />
              </div>
            </div>

            <div className="wp-grid-2" style={{ marginTop: 10 }}>
              <div>
                <div className="wp-label">Bar Radius</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.barRadius || 4}
                  onChange={(e) => handleUpdate({ barRadius: clampNumber(e.target.value, 0, 20, 4) })}
                />
              </div>
              <div>
                <div className="wp-label">Area Opacity</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.areaOpacity || 30}
                  onChange={(e) => handleUpdate({ areaOpacity: clampNumber(e.target.value, 0, 100, 30) })}
                />
              </div>
            </div>

            <div className="wp-grid-2" style={{ marginTop: 10 }}>
              <div>
                <div className="wp-label">Inner Radius</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.innerRadius || 30}
                  onChange={(e) => handleUpdate({ innerRadius: clampNumber(e.target.value, 0, 90, 30) })}
                />
              </div>
              <div>
                <div className="wp-label">Outer Radius</div>
                <input
                  type="number"
                  className="wp-input"
                  value={props.outerRadius || 55}
                  onChange={(e) => handleUpdate({ outerRadius: clampNumber(e.target.value, 10, 95, 55) })}
                />
              </div>
            </div>

            <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
              <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show Pie Labels</span>
              <div className={`prop-toggle${props.pieLabel ? ' on' : ''}`} onClick={() => handleUpdate({ pieLabel: !props.pieLabel })} />
            </div>
          </Section>
        )}

        {isChart && (
          <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
            <div className="wp-label">Chart Size</div>
            <input
              type="range"
              min="70"
              max="150"
              step="5"
              className="wp-range"
              value={props.chartScale || 100}
              onChange={(e) => handleUpdate({ chartScale: Math.max(70, Math.min(150, parseInt(e.target.value, 10) || 100)) })}
            />
            <div className="wp-range-meta">
              <span>Smaller</span>
              <span>{props.chartScale || 100}%</span>
              <span>Larger</span>
            </div>
          </div>
        )}

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
