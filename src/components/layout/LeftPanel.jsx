import { useState } from 'react'
import { ChevronDown, ChevronRight, Hash, Minus, Plus, Trash2 } from 'lucide-react'

const CHART_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#f97316', '#a78bfa',
  '#ef4444', '#34d399', '#fbbf24', '#60a5fa',
]

const BLOCK_NAMES = {
  'kpi-card':       'Number Card',
  'chart-bar':      'Bar Chart',
  'chart-map':      'Map Chart',
  'chart-heatmap':  'Heat Map',
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
  table:            'Table',
  'advanced-table': 'Advanced Table',
  'pivot-table':    'Pivot Table',
  'layout-row':     'Row',
  'layout-column':  'Column',
  'layout-text':    'Text / Title',
  'layout-image':   'Image',
  'layout-divider': 'Divider',
  'layout-spacer':  'Spacer',
  'stat-total':     'Stat Card',
  'stat-positive':  'Progress Indicator',
  'stat-normal':    'Trend Indicator',
  'stat-oral':      'Number Callout',
  'stat-anemia':    'Number Callout',
  'stat-locations': 'Number Callout',
  'stat-tests':     'Number Callout',
}

const WIDGET_DESCRIPTIONS = {
  'kpi-card':       'Displays a key metric or KPI',
  'stat-total':     'Displays a key metric or KPI',
  'stat-positive':  'Displays a key metric or KPI',
  'stat-normal':    'Displays a key metric or KPI',
  'stat-oral':      'Displays a key metric or KPI',
  'stat-anemia':    'Displays a key metric or KPI',
  'stat-locations': 'Displays a key metric or KPI',
  'stat-tests':     'Displays a key metric or KPI',
  'chart-bar':      'Displays data as vertical bars',
  'chart-map':      'Displays camp data in a geographic-style block view',
  'chart-heatmap':  'Displays data intensity across recent days',
  'chart-line':     'Displays data as a line trend',
  'chart-combo':    'Displays bars with an overlay trend line',
  'chart-stackedarea': 'Displays layered area trends',
  'chart-sparkline':'Displays a compact trend summary',
  'chart-radar':    'Displays a multi-metric profile',
  'chart-donut':    'Displays data distribution as a donut',
  'chart-pie':      'Displays data distribution as a pie',
  table:            'Displays data in a tabular format',
  'advanced-table': 'Displays richer table controls and data',
  'pivot-table':    'Displays grouped table summaries',
  'layout-row':     'Creates a horizontal layout container',
  'layout-column':  'Creates a vertical layout container',
  'layout-text':    'Adds a title or text content block',
  'layout-image':   'Adds an image placeholder block',
  'layout-divider': 'Adds a thin divider line',
  'layout-spacer':  'Adds spacing inside the canvas',
}

const DEFAULT_PROPS = {
  title: '', subtitle: '',
  color: '#06b6d4', colSpan: 1, width: 360, height: 420,
  showLegend: true, showGrid: true, showDots: true, pieLabel: false,
  legendPosition: 'bottom',
  fontSize: 11, headingFontSize: 11, chartScale: 100, radius: 15, opacity: 100,
  fontFamily: 'Plus Jakarta Sans', fontWeight: 'Regular (400)',
  metricKey: '',
  dataSource: 'patient-screening-summary',
  showComparison: true,
  comparisonFormat: 'percentage',
  numberFormat: 'comma',
  suffix: '',
  itemColor: '#06b6d4',
  iconColor: '#06b6d4',
  increaseColor: '#16a34a',
  decreaseColor: '#dc2626',
  xKey: '', yKey: '', yKey2: '', extraYKeys: [],
  extraYColors: [], extraYLabels: [],
  strokeWidth: 2, barRadius: 4,
  innerRadius: 30, outerRadius: 55, barSize: 12,
  areaOpacity: 30, series2Color: '#ef4444',
  text: 'Double-click to edit',
  imageAlt: 'Image placeholder',
  imageSrc: '',
  dividerLabel: '',
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

const NUMBER_FORMAT_OPTIONS = [
  { value: 'comma', label: '1,234' },
  { value: 'plain', label: '1234' },
  { value: 'decimal', label: '1,234.0' },
  { value: 'compact', label: '1.2K' },
  { value: 'currency', label: '$1,234' },
]

const COMPARISON_LABEL_OPTIONS = [
  { value: 'vs Apr 1 - Apr 30, 2025', label: 'Previous Period' },
  { value: 'vs Last Month', label: 'Previous Month' },
  { value: 'vs Same Period Last Year', label: 'Same Period Last Year' },
]

const COMPARISON_FORMAT_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'value', label: 'Value Difference' },
  { value: 'both', label: 'Both' },
]

const LEGEND_POSITION_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
]

const STAT_DATA_SOURCES = {
  'patient-screening-summary': {
    label: 'Patient Screening Summary',
    description: 'Primary drive metrics and KPIs',
    defaultMetric: 'totalScreened',
    metrics: [
      { value: 'totalScreened', label: 'Total Patients Screened' },
      { value: 'testsTotal', label: 'Tests Conducted' },
      { value: 'oralCancer', label: 'Positive Cases' },
      { value: 'normal', label: 'Normal / Clear' },
      { value: 'locations', label: 'Referred' },
    ],
  },
  'outcome-summary': {
    label: 'Outcome Summary',
    description: 'Summary of screening outcomes',
    defaultMetric: 'oralCancer',
    metrics: [
      { value: 'oralCancer', label: 'Positive Cases' },
      { value: 'normal', label: 'Normal / Clear' },
      { value: 'locations', label: 'Referred' },
      { value: 'totalScreened', label: 'Total Patients Screened' },
    ],
  },
  'testing-summary': {
    label: 'Testing Summary',
    description: 'Test volume and counts',
    defaultMetric: 'testsTotal',
    metrics: [
      { value: 'testsTotal', label: 'Tests Conducted' },
      { value: 'totalScreened', label: 'Total Patients Screened' },
      { value: 'oralCancer', label: 'Positive Cases' },
    ],
  },
}

function getStatSourceConfig(sourceKey) {
  return STAT_DATA_SOURCES[sourceKey] || STAT_DATA_SOURCES['patient-screening-summary']
}

function getChartMapping(type) {
  if (type === 'chart-bar' || type === 'chart-line' || type === 'chart-area' || type === 'chart-combo' || type === 'chart-stackedarea') {
    return { x: ['day'], y: ['screened', 'positive', 'normal'], hasSecondary: true }
  }
  if (type === 'chart-sparkline') return { x: ['day'], y: ['screened'], hasSecondary: false }
  if (type === 'chart-hbar') return { x: ['name'], y: ['value'], hasSecondary: false }
  if (type === 'chart-stacked') return { x: ['day'], y: ['normal', 'positive', 'screened'], hasSecondary: true }
  if (type === 'chart-radar') return { x: ['camp'], y: ['screened', 'positive'], hasSecondary: true }
  if (type === 'chart-pie' || type === 'chart-donut') return { x: ['label'], y: ['value'], hasSecondary: false }
  if (type === 'chart-radialbar') return { x: ['camp'], y: ['screened', 'positive'], hasSecondary: false }
  if (type === 'chart-scatter') return { x: ['group'], y: ['count'], hasSecondary: false }
  return { x: ['day'], y: ['screened'], hasSecondary: false }
}

function getAxisOptions(type, axis = 'x') {
  const mapping = getChartMapping(type)
  return axis === 'x' ? mapping.x : mapping.y
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
  const isStat = isStatType(selectedBlock.type) || selectedBlock.type === 'kpi-card'
  const isChart = selectedBlock.type?.startsWith('chart-')
  const isLayout = selectedBlock.type?.startsWith('layout-')
  const statSource = isStat ? getStatSourceConfig(props.dataSource) : null
  const statMetricOptions = statSource?.metrics || []
  const activeMetricKey = isStat ? (props.metricKey || statSource?.defaultMetric || 'totalScreened') : ''
  const chartMapping = isChart ? getChartMapping(selectedBlock.type) : null
  const chartXAxisOptions = chartMapping ? getAxisOptions(selectedBlock.type, 'x') : []
  const chartYAxisOptions = chartMapping ? getAxisOptions(selectedBlock.type, 'y') : []

  const handleUpdate = (patch) => {
    onUpdateBlock(patch)
  }

  const clampNumber = (value, min, max, fallback) => {
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return fallback
    return Math.max(min, Math.min(max, parsed))
  }

  const updateHeadingFontSize = (value) => {
    handleUpdate({ headingFontSize: clampNumber(value, 6, 72, props.headingFontSize || props.fontSize || 11) })
  }

  const headingFontSizeControl = isChart ? (
    <div className="wp-section wp-section--chart-heading" style={{ borderBottomColor: '#f2f4f7' }}>
      <div className="wp-label">Chart Heading</div>
      <div className="wp-control-help">Heading Font Size</div>
      <div className="wp-stepper">
        <button
          type="button"
          onClick={() => updateHeadingFontSize((props.headingFontSize || props.fontSize || 11) - 1)}
          aria-label="Decrease chart heading font size"
          title="Decrease heading font size"
          className="wp-stepper-btn"
        >
          <Minus size={13} />
        </button>
        <input
          type="number"
          className="wp-input"
          min="6"
          max="72"
          value={props.headingFontSize || props.fontSize || 11}
          onChange={(e) => updateHeadingFontSize(e.target.value)}
          aria-label="Chart heading font size"
        />
        <button
          type="button"
          onClick={() => updateHeadingFontSize((props.headingFontSize || props.fontSize || 11) + 1)}
          aria-label="Increase chart heading font size"
          title="Increase heading font size"
          className="wp-stepper-btn"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  ) : null

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

        {headingFontSizeControl}

        {(isStat || isChart) && (
          <Section title="Metric Data" defaultOpen>
            {isStat && (
              <>
                <div className="wp-section" style={{ padding: 0, borderBottom: 'none' }}>
                  <div className="wp-label">Data Source</div>
                  <select
                    className="wp-select"
                    value={props.dataSource || 'patient-screening-summary'}
                    onChange={(e) => {
                      const nextSource = e.target.value
                      const sourceConfig = getStatSourceConfig(nextSource)
                      handleUpdate({
                        dataSource: nextSource,
                        metricKey: sourceConfig.defaultMetric,
                        metricValue: '',
                      })
                    }}
                  >
                    {Object.entries(STAT_DATA_SOURCES).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                  <div className="wp-control-help" style={{ marginTop: 6 }}>{statSource?.description}</div>
                </div>

                <div className="wp-section" style={{ padding: '10px 0 0', borderBottom: 'none' }}>
                  <div className="wp-label">Metric / Value</div>
                  <select
                    className="wp-select"
                    value={activeMetricKey}
                    onChange={(e) => handleUpdate({ metricKey: e.target.value, metricValue: '' })}
                  >
                    {statMetricOptions.map((metric) => (
                      <option key={metric.value} value={metric.value}>{metric.label}</option>
                    ))}
                  </select>
                </div>

                <div className="wp-section" style={{ padding: '10px 0 0', borderBottom: 'none' }}>
                  <div className="wp-label">Comparison</div>
                  <select
                    className="wp-select"
                    value={props.comparisonLabel || 'vs Apr 1 - Apr 30, 2025'}
                    onChange={(e) => handleUpdate({ comparisonLabel: e.target.value })}
                  >
                    {COMPARISON_LABEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
                  <span className="wp-row-label">Show comparison</span>
                  <div className={`prop-toggle${props.showComparison !== false ? ' on' : ''}`} onClick={() => handleUpdate({ showComparison: props.showComparison === false })} />
                </div>

                <div className="wp-section" style={{ padding: '0', borderBottom: 'none' }}>
                  <div className="wp-label">Comparison Format</div>
                  <select
                    className="wp-select"
                    value={props.comparisonFormat || 'percentage'}
                    onChange={(e) => handleUpdate({ comparisonFormat: e.target.value })}
                  >
                    {COMPARISON_FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {isChart && (
              <>
                <div className="wp-section" style={{ padding: 0, borderBottom: 'none' }}>
                  <div className="wp-control-help" style={{ marginTop: 0, marginBottom: 10 }}>
                    Map the data fields used by the chart. The available axes change based on the selected chart type.
                  </div>
                  <div className="wp-grid-2">
                    <div>
                      <div className="wp-label">X Axis</div>
                      <select
                        className="wp-select"
                        value={props.xKey || ''}
                        onChange={(e) => handleUpdate({ xKey: e.target.value })}
                      >
                        {chartXAxisOptions.map((axisKey) => (
                          <option key={axisKey} value={axisKey}>{axisKey}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="wp-label">Y Axis</div>
                      <select
                        className="wp-select"
                        value={props.yKey || ''}
                        onChange={(e) => handleUpdate({ yKey: e.target.value })}
                      >
                        {chartYAxisOptions.map((axisKey) => (
                          <option key={axisKey} value={axisKey}>{axisKey}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {chartMapping?.hasSecondary && (
                    <div style={{ marginTop: 10 }}>
                      <div className="wp-label">Secondary Series</div>
                      <select
                        className="wp-select"
                        value={props.yKey2 || ''}
                        onChange={(e) => handleUpdate({ yKey2: e.target.value })}
                      >
                        {chartYAxisOptions.map((axisKey) => (
                          <option key={axisKey} value={axisKey}>{axisKey}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </Section>
        )}

        {/* Primary Color */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-grid-2">
            <div>
              <div className="wp-label">{isStat ? 'Item color' : 'Color'}</div>
              <input
                type="color"
                className="wp-input"
                style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                value={(isStat ? props.itemColor : props.color) || '#06b6d4'}
                onChange={(e) => handleUpdate(isStat ? { itemColor: e.target.value, color: e.target.value } : { color: e.target.value })}
              />
            </div>
            <div>
               <div className="wp-label">{isStat ? 'Icon color' : 'Secondary Color'}</div>
              <input
                type="color"
                className="wp-input"
                style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                value={(isStat ? props.iconColor : props.series2Color) || '#ef4444'}
                onChange={(e) => handleUpdate(isStat ? { iconColor: e.target.value } : { series2Color: e.target.value })}
              />
            </div>
          </div>
        </div>

        {isStat && (
          <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
            <div className="wp-grid-2">
              <div>
                <div className="wp-label">Number Format</div>
                <select
                  className="wp-select"
                  value={props.numberFormat || 'comma'}
                  onChange={(e) => handleUpdate({ numberFormat: e.target.value })}
                >
                  {NUMBER_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="wp-label">Suffix (optional)</div>
                <input
                  className="wp-input"
                  value={props.suffix || ''}
                  onChange={(e) => handleUpdate({ suffix: e.target.value })}
                  placeholder="%"
                />
              </div>
            </div>
            <div className="wp-grid-2" style={{ marginTop: 10 }}>
              <div>
                <div className="wp-label">Color for increase</div>
                <input
                  type="color"
                  className="wp-input"
                  style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                  value={props.increaseColor || '#16a34a'}
                  onChange={(e) => handleUpdate({ increaseColor: e.target.value })}
                />
              </div>
              <div>
                <div className="wp-label">Color for decrease</div>
                <input
                  type="color"
                  className="wp-input"
                  style={{ padding: '0 4px', height: '36px', cursor: 'pointer' }}
                  value={props.decreaseColor || '#dc2626'}
                  onChange={(e) => handleUpdate({ decreaseColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Visibility */}
        <div className="wp-section" style={{ borderBottomColor: '#f2f4f7' }}>
          <div className="wp-label">Options</div>
          
          <div className="wp-row" style={{ marginTop: 12, marginBottom: 12 }}>
            <span className="wp-label" style={{ margin: 0, flex: 1 }}>Show Legend</span>
            <div className={`prop-toggle${props.showLegend ? ' on' : ''}`} onClick={() => handleUpdate({ showLegend: !props.showLegend })} />
          </div>

          {isChart && props.showLegend !== false && (
            <div style={{ marginTop: 12 }}>
              <div className="wp-label">Legend Position</div>
              <select
                className="wp-select"
                value={props.legendPosition || 'bottom'}
                onChange={(e) => handleUpdate({ legendPosition: e.target.value })}
              >
                {LEGEND_POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

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
            {!isChart && (
            <div>
              <div className="wp-label">Border Radius</div>
              <input
                 type="number"
                className="wp-input"
                value={props.radius || 15}
                onChange={(e) => handleUpdate({ radius: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
            )}
          </div>
          {isChart && (
            <div style={{ marginTop: 10 }}>
              <div className="wp-label">Border Radius</div>
              <input
                 type="number"
                className="wp-input"
                value={props.radius || 15}
                onChange={(e) => handleUpdate({ radius: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
          )}
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

        {isLayout && (
          <Section title="Layout Content" defaultOpen>
            {selectedBlock.type === 'layout-text' && (
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div className="wp-label">Text</div>
                  <textarea
                    className="wp-input"
                    style={{ minHeight: 88, resize: 'vertical', lineHeight: 1.5 }}
                    value={props.text || ''}
                    onChange={(e) => handleUpdate({ text: e.target.value })}
                    placeholder="Add text content"
                  />
                </div>
                <p className="wp-placeholder-text">
                  Type anything you want here. This text updates directly on the canvas.
                </p>
              </div>
            )}

            {selectedBlock.type === 'layout-image' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div className="wp-label">Image from local system</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="wp-input"
                    style={{ paddingTop: 7, paddingBottom: 7 }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        handleUpdate({
                          imageSrc: String(reader.result || ''),
                          imageAlt: file.name || props.imageAlt || 'Uploaded image',
                        })
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }}
                  />
                </div>
                <div>
                  <div className="wp-label">Image from internet</div>
                  <input
                    className="wp-input"
                    value={props.imageSrc || ''}
                    onChange={(e) => handleUpdate({ imageSrc: e.target.value })}
                    placeholder="Paste an image URL"
                  />
                </div>
                <div>
                  <div className="wp-label">Image Alt Text</div>
                  <input
                    className="wp-input"
                    value={props.imageAlt || ''}
                    onChange={(e) => handleUpdate({ imageAlt: e.target.value })}
                    placeholder="Describe the image"
                  />
                </div>
                <button
                  type="button"
                  className="wp-delete-btn-flat"
                  style={{ justifyContent: 'center', marginTop: 2 }}
                  onClick={() => handleUpdate({ imageSrc: '', imageAlt: 'Image placeholder' })}
                >
                  Clear image
                </button>
              </div>
            )}

            {selectedBlock.type === 'layout-divider' && (
              <div>
                <div className="wp-label">Divider Label</div>
                <input
                  className="wp-input"
                  value={props.dividerLabel || ''}
                  onChange={(e) => handleUpdate({ dividerLabel: e.target.value })}
                  placeholder="Optional label"
                />
              </div>
            )}

            {(selectedBlock.type === 'layout-row' || selectedBlock.type === 'layout-column' || selectedBlock.type === 'layout-spacer') && (
              <p className="wp-placeholder-text">
                This block is structural. Resize it on the canvas to shape the empty space or container.
              </p>
            )}
          </Section>
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
