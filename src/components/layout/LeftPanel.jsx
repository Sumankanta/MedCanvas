import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, CircleDashed, Plus, X } from 'lucide-react'

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
  'stat-total':     'Total Patients',
  'stat-positive':  'Positive Cases',
  'stat-normal':    'Normal / Clear',
  'stat-oral':      'Oral Cancer +ve',
  'stat-anemia':    'Anemia +ve',
  'stat-locations': 'Camp Locations',
  'stat-tests':     'Tests Conducted',
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

const TYPE_OPTIONS = {
  'chart-bar':      { x: ['day'],   y: ['screened','positive','normal'], secondary: true  },
  'chart-stacked':  { x: ['day'],   y: ['normal','positive','screened'], secondary: true  },
  'chart-line':     { x: ['day'],   y: ['screened','positive','normal'], secondary: true  },
  'chart-area':     { x: ['day'],   y: ['screened','positive','normal'], secondary: true  },
  'chart-pie':      { x: ['label'], y: ['value'],                        secondary: false },
  'chart-donut':    { x: ['label'], y: ['value'],                        secondary: false },
  'chart-radialbar':{ x: ['camp'],  y: ['screened','positive'],          secondary: false },
  'chart-scatter':  { x: ['group'], y: ['count'],                        secondary: false },
  num:              { x: ['label'], y: ['value'],                        secondary: false },
  table:            { x: ['id'],    y: [],                               secondary: false },
}

function heightLimits(type) {
  return type?.startsWith('stat-')
    ? { min: 120, max: 500, default: 180 }
    : { min: 200, max: 900, default: 380 }
}

function isChartType(type) { return type?.startsWith('chart-') }
function isStatType(type)  { return type?.startsWith('stat-')  }

function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <select className="prop-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

// ── Inline color picker dropdown ─────────────────────────────
const DROPDOWN_W = 136
const DROPDOWN_H = 116

function ColorDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          !e.target.closest('[data-color-palette]')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (!btnRef.current) { setOpen((o) => !o); return }
    const r = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const top  = spaceBelow >= DROPDOWN_H + 6 ? r.bottom + 4 : r.top - DROPDOWN_H - 4
    const rawLeft = r.left
    const left = rawLeft + DROPDOWN_W > window.innerWidth - 8 ? window.innerWidth - DROPDOWN_W - 8 : rawLeft
    setPos({ top, left })
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: 26, height: 22, borderRadius: 5,
          background: value,
          border: '2px solid rgba(255,255,255,0.18)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, flexShrink: 0,
          boxShadow: open ? `0 0 0 2px ${value}55` : 'none',
          transition: 'box-shadow 0.14s',
        }}
        title="Pick color"
      >
        <ChevronDown size={9} style={{ color: 'rgba(255,255,255,0.7)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          data-color-palette
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            background: 'var(--bg-deep)', border: '1px solid var(--border-mid)',
            borderRadius: 8, padding: 8,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5,
            boxShadow: 'var(--shadow-xl)', width: DROPDOWN_W,
            animation: 'colorDropIn 0.12s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {CHART_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => { onChange(c); setOpen(false) }}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 5,
                background: c, cursor: 'pointer',
                border: c === value ? '2px solid #fff' : '2px solid transparent',
                boxShadow: c === value ? `0 0 0 1px ${c}` : 'none',
                transition: 'transform 0.12s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.18)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ── Series row ───────────────────────────────────────────────
function SeriesRow({ label, fieldValue, fieldOptions, colorValue, labelValue, onFieldChange, onColorChange, onLabelChange, onRemove }) {
  const [editing, setEditing] = useState(false)

  return (
    <div style={{ marginBottom: 7 }}>
      <div className="prop-row" style={{ marginBottom: editing ? 4 : 0 }}>
        <span className="prop-label" style={{ minWidth: 48 }}>{label}</span>
        <ColorDropdown value={colorValue} onChange={onColorChange} />
        <select className="prop-select" value={fieldValue} onChange={(e) => onFieldChange(e.target.value)} style={{ flex: 1, marginLeft: 5 }}>
          {fieldOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <button
          title="Rename label"
          onClick={() => setEditing((e) => !e)}
          style={{
            width: 20, height: 20, borderRadius: 4,
            background: editing ? 'var(--cyan-dim)' : 'transparent',
            border: `1px solid ${editing ? 'rgba(6,182,212,0.4)' : 'var(--border-subtle)'}`,
            color: editing ? '#67e8f9' : 'var(--text-faint)',
            fontSize: 9, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 3, transition: 'all 0.14s',
          }}
        >Aa</button>
        {onRemove && (
          <button className="tb-btn" onClick={onRemove} style={{ width: 20, height: 20, flexShrink: 0, marginLeft: 2 }} title="Remove field">
            <X size={11} />
          </button>
        )}
      </div>
      {editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 56 }}>
          <div style={{ width: 3, height: 22, borderRadius: 2, background: colorValue, flexShrink: 0 }} />
          <input
            className="prop-input"
            value={labelValue}
            placeholder={`Label for "${fieldValue}"`}
            onChange={(e) => onLabelChange(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

// ── LeftPanel ─────────────────────────────────────────────────
export default function LeftPanel({
  open, selectedBlock, selectedSection,
  cols,           // = section's cols (for column picker range)
  onUpdateBlock,
  onUpdateSection, // for moving widget between columns
  onClose,
}) {
  const [tab, setTab] = useState('style')

  const [title,        setTitle]        = useState('')
  const [subtitle,     setSubtitle]     = useState('')
  const [color,        setColor]        = useState(DEFAULT_PROPS.color)
  const [showLegend,   setShowLegend]   = useState(DEFAULT_PROPS.showLegend)
  const [showGrid,     setShowGrid]     = useState(DEFAULT_PROPS.showGrid)
  const [showDots,     setShowDots]     = useState(DEFAULT_PROPS.showDots)
  const [pieLabel,     setPieLabel]     = useState(DEFAULT_PROPS.pieLabel)
  const [fontSize,     setFontSize]     = useState(DEFAULT_PROPS.fontSize)
  const [radius,       setRadius]       = useState(DEFAULT_PROPS.radius)
  const [opacity,      setOpacity]      = useState(DEFAULT_PROPS.opacity)
  const [width,        setWidth]        = useState(360)
  const [height,       setHeight]       = useState(DEFAULT_PROPS.height)
  const [fontFamily,   setFontFamily]   = useState(DEFAULT_PROPS.fontFamily)
  const [fontWeight,   setFontWeight]   = useState(DEFAULT_PROPS.fontWeight)
  const [xKey,         setXKey]         = useState(DEFAULT_PROPS.xKey)
  const [yKey,         setYKey]         = useState(DEFAULT_PROPS.yKey)
  const [yKey2,        setYKey2]        = useState(DEFAULT_PROPS.yKey2)
  const [series2Color, setSeries2Color] = useState(DEFAULT_PROPS.series2Color)
  const [extraYKeys,   setExtraYKeys]   = useState(DEFAULT_PROPS.extraYKeys)
  const [extraYColors, setExtraYColors] = useState(DEFAULT_PROPS.extraYColors)
  const [extraYLabels, setExtraYLabels] = useState(DEFAULT_PROPS.extraYLabels)
  const [strokeWidth,  setStrokeWidth]  = useState(DEFAULT_PROPS.strokeWidth)
  const [barRadius,    setBarRadius]    = useState(DEFAULT_PROPS.barRadius)
  const [innerRadius,  setInnerRadius]  = useState(DEFAULT_PROPS.innerRadius)
  const [outerRadius,  setOuterRadius]  = useState(DEFAULT_PROPS.outerRadius)
  const [barSize,      setBarSize]      = useState(DEFAULT_PROPS.barSize)
  const [areaOpacity,  setAreaOpacity]  = useState(DEFAULT_PROPS.areaOpacity)

  // Current column of selected block (for column picker)
  const currentCol = useMemo(() => {
    if (!selectedBlock || !selectedSection) return 0
    return selectedSection.colSpanMap?.[selectedBlock.id]?.col ?? 0
  }, [selectedBlock, selectedSection])

  const typeOpt  = useMemo(() => TYPE_OPTIONS[selectedBlock?.type] || TYPE_OPTIONS['chart-bar'], [selectedBlock?.type])
  const hLimits  = useMemo(() => heightLimits(selectedBlock?.type), [selectedBlock?.type])
  const selectedId = selectedBlock?.id
  const sectionColSpanMapStr = JSON.stringify(selectedSection?.colSpanMap || {})

  useEffect(() => {
    if (!selectedBlock) return
    const props = { ...DEFAULT_PROPS, ...selectedBlock.props }
    const lim   = heightLimits(selectedBlock.type)

    setTitle(props.title || BLOCK_NAMES[selectedBlock.type] || 'Widget')
    setSubtitle(props.subtitle ?? '')
    setColor(props.color || DEFAULT_PROPS.color)
    setShowLegend(Boolean(props.showLegend))
    setShowGrid(Boolean(props.showGrid))
    setShowDots(Boolean(props.showDots))
    setPieLabel(Boolean(props.pieLabel))
    setFontSize(Number(props.fontSize) || DEFAULT_PROPS.fontSize)
    setRadius(Number(props.radius) || DEFAULT_PROPS.radius)
    setOpacity(Number(props.opacity) || DEFAULT_PROPS.opacity)
    setWidth(Number(props.width) || 360)
    // ── Height: clamp to section-aware limits ──
    const rawH = Number(props.height) || lim.default
    setHeight(Math.max(lim.min, Math.min(lim.max, rawH)))
    setFontFamily(props.fontFamily || DEFAULT_PROPS.fontFamily)
    setFontWeight(props.fontWeight || DEFAULT_PROPS.fontWeight)
    setXKey(props.xKey || typeOpt.x[0] || '')
    setYKey(props.yKey || typeOpt.y[0] || '')
    setYKey2(props.yKey2 || typeOpt.y[1] || typeOpt.y[0] || '')
    setSeries2Color(props.series2Color || DEFAULT_PROPS.series2Color)
    const validKeys = Array.isArray(props.extraYKeys)
      ? props.extraYKeys.filter((k) => typeOpt.y.includes(k))
      : []
    setExtraYKeys(validKeys)
    setExtraYColors(
      Array.isArray(props.extraYColors) && props.extraYColors.length === validKeys.length
        ? props.extraYColors
        : validKeys.map((_, i) => CHART_COLORS[(i + 2) % CHART_COLORS.length])
    )
    setExtraYLabels(
      Array.isArray(props.extraYLabels) && props.extraYLabels.length === validKeys.length
        ? props.extraYLabels
        : validKeys.map((k) => k)
    )
    setStrokeWidth(Number(props.strokeWidth) || DEFAULT_PROPS.strokeWidth)
    setBarRadius(Number(props.barRadius) || DEFAULT_PROPS.barRadius)
    setInnerRadius(Number(props.innerRadius) || DEFAULT_PROPS.innerRadius)
    setOuterRadius(Number(props.outerRadius) || DEFAULT_PROPS.outerRadius)
    setBarSize(Number(props.barSize) || DEFAULT_PROPS.barSize)
    setAreaOpacity(Number(props.areaOpacity) || DEFAULT_PROPS.areaOpacity)
  }, [selectedId, typeOpt.x, typeOpt.y, sectionColSpanMapStr])

  // Move widget to a different column inside its section
  function moveToCol(colIndex) {
    if (!selectedBlock || !selectedSection || !onUpdateSection) return
    const newColSpanMap = {
      ...(selectedSection.colSpanMap || {}),
      [selectedBlock.id]: { col: colIndex, colSpan: 1 },
    }
    onUpdateSection({ colSpanMap: newColSpanMap })
  }

  // Extra series helpers
  function addExtraField() {
    const nextKey    = typeOpt.y.find((k) => ![yKey, yKey2, ...extraYKeys].includes(k)) || typeOpt.y[0]
    const nextColor  = CHART_COLORS[(extraYKeys.length + 2) % CHART_COLORS.length]
    const nextKeys   = [...extraYKeys,   nextKey]
    const nextColors = [...extraYColors, nextColor]
    const nextLabels = [...extraYLabels, nextKey]
    setExtraYKeys(nextKeys); setExtraYColors(nextColors); setExtraYLabels(nextLabels)
    onUpdateBlock({ extraYKeys: nextKeys, extraYColors: nextColors, extraYLabels: nextLabels })
  }

  function updateExtraField(idx, key) {
    const nextKeys   = extraYKeys.map((k, i) => (i === idx ? key : k))
    const nextLabels = extraYLabels.map((l, i) => (i === idx ? key : l))
    setExtraYKeys(nextKeys); setExtraYLabels(nextLabels)
    onUpdateBlock({ extraYKeys: nextKeys, extraYLabels: nextLabels })
  }

  function updateExtraColor(idx, c) {
    const next = extraYColors.map((v, i) => (i === idx ? c : v))
    setExtraYColors(next); onUpdateBlock({ extraYColors: next })
  }

  function updateExtraLabel(idx, label) {
    const next = extraYLabels.map((v, i) => (i === idx ? label : v))
    setExtraYLabels(next); onUpdateBlock({ extraYLabels: next })
  }

  function removeExtraField(idx) {
    const nextKeys   = extraYKeys.filter((_, i) => i !== idx)
    const nextColors = extraYColors.filter((_, i) => i !== idx)
    const nextLabels = extraYLabels.filter((_, i) => i !== idx)
    setExtraYKeys(nextKeys); setExtraYColors(nextColors); setExtraYLabels(nextLabels)
    onUpdateBlock({ extraYKeys: nextKeys, extraYColors: nextColors, extraYLabels: nextLabels })
  }

  // ── No selection ──────────────────────────────────────────
  if (!selectedBlock) {
    return (
      <aside className={`left-panel${open ? '' : ' collapsed'}`}>
        <div className="panel-header">
          <span className="panel-title">Properties</span>
          <button className="panel-close" onClick={onClose}><X size={12} /></button>
        </div>
        <div className="no-selection">
          <div className="no-selection-icon"><CircleDashed size={28} /></div>
          <p className="no-selection-text">Select a widget on the canvas to edit its properties here</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`left-panel${open ? '' : ' collapsed'}`}>
      <div className="panel-header">
        <span className="panel-title">{BLOCK_NAMES[selectedBlock.type] || 'Widget'}</span>
        <button className="panel-close" onClick={onClose}><X size={12} /></button>
      </div>

      <div className="panel-tabs">
        {['style', 'data'].map((t) => (
          <button key={t} className={`panel-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="panel-body">
        {/* ═══════════ STYLE TAB ═══════════ */}
        {tab === 'style' && (
          <>
            {/* HEADING */}
            <div className="prop-section">
              <div className="prop-section-title">Heading</div>
              <div className="prop-row">
                <span className="prop-label">Title</span>
                <input className="prop-input" value={title}
                  onChange={(e) => { setTitle(e.target.value); onUpdateBlock({ title: e.target.value }) }}
                  placeholder="Widget title"
                />
              </div>
              <div className="prop-row">
                <span className="prop-label">Subtitle</span>
                <input className="prop-input" value={subtitle}
                  onChange={(e) => { setSubtitle(e.target.value); onUpdateBlock({ subtitle: e.target.value }) }}
                  placeholder="Widget subtitle"
                />
              </div>
            </div>

            {/* LAYOUT */}
            <div className="prop-section">
              <div className="prop-section-title">Layout</div>

              <div className="prop-row">
                <span className="prop-label">Width</span>
                <input
                  type="range"
                  className="prop-slider"
                  min={180}
                  max={1200}
                  step={10}
                  value={width}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setWidth(v)
                    onUpdateBlock({ width: v })
                  }}
                />
                <span className="prop-val">{width}px</span>
              </div>

              {/* ── Height slider ── */}
              <div className="prop-row">
                <span className="prop-label">Height</span>
                <input
                  type="range"
                  className="prop-slider"
                  min={hLimits.min}
                  max={hLimits.max}
                  step={10}
                  value={height}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setHeight(v)
                    onUpdateBlock({ height: v })
                  }}
                />
                <span className="prop-val">{height}px</span>
              </div>

              <div className="prop-row">
                <span className="prop-label">Radius</span>
                <input type="range" className="prop-slider" min="0" max="24" value={radius}
                  onChange={(e) => { const v = Number(e.target.value); setRadius(v); onUpdateBlock({ radius: v }) }}
                />
                <span className="prop-val">{radius}px</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">Opacity</span>
                <input type="range" className="prop-slider" min="20" max="100" value={opacity}
                  onChange={(e) => { const v = Number(e.target.value); setOpacity(v); onUpdateBlock({ opacity: v }) }}
                />
                <span className="prop-val">{opacity}%</span>
              </div>
            </div>

            {/* ACCENT COLOR */}
            <div className="prop-section">
              <div className="prop-section-title">Accent Color</div>
              <div className="color-grid">
                {CHART_COLORS.map((c) => (
                  <div key={c}
                    className={`color-swatch${color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => { setColor(c); onUpdateBlock({ color: c }) }}
                  />
                ))}
              </div>
            </div>

            {/* TYPOGRAPHY */}
            <div className="prop-section">
              <div className="prop-section-title">Typography</div>
              <div className="prop-row">
                <span className="prop-label">Font Size</span>
                <input type="range" className="prop-slider" min="8" max="20" value={fontSize}
                  onChange={(e) => { const v = Number(e.target.value); setFontSize(v); onUpdateBlock({ fontSize: v }) }}
                />
                <span className="prop-val">{fontSize}px</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">Font</span>
                <select className="prop-select" value={fontFamily}
                  onChange={(e) => { setFontFamily(e.target.value); onUpdateBlock({ fontFamily: e.target.value }) }}>
                  <option>Plus Jakarta Sans</option>
                  <option>JetBrains Mono</option>
                  <option>System UI</option>
                </select>
              </div>
              <div className="prop-row">
                <span className="prop-label">Weight</span>
                <select className="prop-select" value={fontWeight}
                  onChange={(e) => { setFontWeight(e.target.value); onUpdateBlock({ fontWeight: e.target.value }) }}>
                  <option>Regular (400)</option>
                  <option>Medium (500)</option>
                  <option>Bold (700)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* ═══════════ DATA TAB ═══════════ */}
        {tab === 'data' && (
          <>
            {isStatType(selectedBlock.type) ? (
              <div className="no-selection" style={{ paddingTop: 32 }}>
                <div className="no-selection-icon" style={{ fontSize: 24 }}>📊</div>
                <p className="no-selection-text">
                  Stat blocks pull live data automatically from the drive variables. No mapping needed.
                </p>
              </div>
            ) : (
              <>
                <div className="prop-section">
                  <div className="prop-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Chart Mapping</span>
                    {typeOpt.y.length > 0 && (
                      <button className="tb-btn" style={{ width: 20, height: 20 }} title="Add series field" onClick={addExtraField}>
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  <SelectRow label="X Axis" value={xKey} onChange={(v) => { setXKey(v); onUpdateBlock({ xKey: v }) }} options={typeOpt.x} />

                  {typeOpt.y.length > 0 && (
                    <SeriesRow
                      label="Primary"
                      fieldValue={yKey} fieldOptions={typeOpt.y}
                      colorValue={color} labelValue={yKey}
                      onFieldChange={(v) => { setYKey(v); onUpdateBlock({ yKey: v }) }}
                      onColorChange={(c) => { setColor(c); onUpdateBlock({ color: c }) }}
                      onLabelChange={() => {}} onRemove={null}
                    />
                  )}

                  {typeOpt.secondary && (
                    <SeriesRow
                      label="Secondary"
                      fieldValue={yKey2} fieldOptions={typeOpt.y}
                      colorValue={series2Color} labelValue={yKey2}
                      onFieldChange={(v) => { setYKey2(v); onUpdateBlock({ yKey2: v }) }}
                      onColorChange={(c) => { setSeries2Color(c); onUpdateBlock({ series2Color: c }) }}
                      onLabelChange={() => {}} onRemove={null}
                    />
                  )}

                  {extraYKeys.map((field, idx) => (
                    <SeriesRow
                      key={`extra-${idx}`}
                      label={`Field ${idx + 1}`}
                      fieldValue={field} fieldOptions={typeOpt.y}
                      colorValue={extraYColors[idx] || CHART_COLORS[(idx + 2) % CHART_COLORS.length]}
                      labelValue={extraYLabels[idx] || field}
                      onFieldChange={(v) => updateExtraField(idx, v)}
                      onColorChange={(c) => updateExtraColor(idx, c)}
                      onLabelChange={(l) => updateExtraLabel(idx, l)}
                      onRemove={() => removeExtraField(idx)}
                    />
                  ))}

                  {extraYKeys.length > 0 && (
                    <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.5, padding: '5px 7px', background: 'rgba(6,182,212,0.04)', borderRadius: 5, border: '1px solid rgba(6,182,212,0.1)' }}>
                      Click <strong style={{ color: 'var(--text-muted)' }}>Aa</strong> on any row to rename its legend label.
                    </p>
                  )}
                </div>

                {isChartType(selectedBlock.type) && (
                  <div className="prop-section">
                    <div className="prop-section-title">Display</div>
                    <div className="prop-row">
                      <span className="prop-label">Show Legend</span>
                      <div className={`prop-toggle${showLegend ? ' on' : ''}`} onClick={() => { const v = !showLegend; setShowLegend(v); onUpdateBlock({ showLegend: v }) }} />
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">Show Grid</span>
                      <div className={`prop-toggle${showGrid ? ' on' : ''}`} onClick={() => { const v = !showGrid; setShowGrid(v); onUpdateBlock({ showGrid: v }) }} />
                    </div>
                    {selectedBlock.type === 'chart-line' && (
                      <div className="prop-row">
                        <span className="prop-label">Show Dots</span>
                        <div className={`prop-toggle${showDots ? ' on' : ''}`} onClick={() => { const v = !showDots; setShowDots(v); onUpdateBlock({ showDots: v }) }} />
                      </div>
                    )}
                    {(selectedBlock.type === 'chart-pie' || selectedBlock.type === 'chart-donut') && (
                      <div className="prop-row">
                        <span className="prop-label">Slice Labels</span>
                        <div className={`prop-toggle${pieLabel ? ' on' : ''}`} onClick={() => { const v = !pieLabel; setPieLabel(v); onUpdateBlock({ pieLabel: v }) }} />
                      </div>
                    )}
                  </div>
                )}

                {(selectedBlock.type === 'chart-line' || selectedBlock.type === 'chart-area') && (
                  <div className="prop-section">
                    <div className="prop-section-title">Line Options</div>
                    <div className="prop-row">
                      <span className="prop-label">Stroke</span>
                      <input type="range" className="prop-slider" min="1" max="6" value={strokeWidth}
                        onChange={(e) => { const v = Number(e.target.value); setStrokeWidth(v); onUpdateBlock({ strokeWidth: v }) }}
                      />
                      <span className="prop-val">{strokeWidth}px</span>
                    </div>
                    {selectedBlock.type === 'chart-area' && (
                      <div className="prop-row">
                        <span className="prop-label">Fill Opacity</span>
                        <input type="range" className="prop-slider" min="5" max="80" value={areaOpacity}
                          onChange={(e) => { const v = Number(e.target.value); setAreaOpacity(v); onUpdateBlock({ areaOpacity: v }) }}
                        />
                        <span className="prop-val">{areaOpacity}%</span>
                      </div>
                    )}
                  </div>
                )}

                {(selectedBlock.type === 'chart-bar' || selectedBlock.type === 'chart-stacked' || selectedBlock.type === 'chart-scatter') && (
                  <div className="prop-section">
                    <div className="prop-section-title">Bar Options</div>
                    <div className="prop-row">
                      <span className="prop-label">Bar Radius</span>
                      <input type="range" className="prop-slider" min="0" max="14" value={barRadius}
                        onChange={(e) => { const v = Number(e.target.value); setBarRadius(v); onUpdateBlock({ barRadius: v }) }}
                      />
                      <span className="prop-val">{barRadius}px</span>
                    </div>
                  </div>
                )}

                {(selectedBlock.type === 'chart-pie' || selectedBlock.type === 'chart-donut' || selectedBlock.type === 'chart-radialbar') && (
                  <div className="prop-section">
                    <div className="prop-section-title">Radius Options</div>
                    <div className="prop-row">
                      <span className="prop-label">Inner</span>
                      <input type="range" className="prop-slider" min="0" max="65" value={innerRadius}
                        onChange={(e) => { const v = Number(e.target.value); setInnerRadius(v); onUpdateBlock({ innerRadius: v }) }}
                      />
                      <span className="prop-val">{innerRadius}%</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">Outer</span>
                      <input type="range" className="prop-slider" min="20" max="95" value={outerRadius}
                        onChange={(e) => { const v = Number(e.target.value); setOuterRadius(v); onUpdateBlock({ outerRadius: v }) }}
                      />
                      <span className="prop-val">{outerRadius}%</span>
                    </div>
                    {selectedBlock.type === 'chart-radialbar' && (
                      <div className="prop-row">
                        <span className="prop-label">Bar Size</span>
                        <input type="range" className="prop-slider" min="4" max="24" value={barSize}
                          onChange={(e) => { const v = Number(e.target.value); setBarSize(v); onUpdateBlock({ barSize: v }) }}
                        />
                        <span className="prop-val">{barSize}px</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
