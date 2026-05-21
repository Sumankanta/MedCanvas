export const BLOCK_TYPES = [
  { type: 'chart-bar',        label: 'Bar Chart',         desc: 'Screenings by day',      icon: '📊', color: '#3b82f6' },
  { type: 'chart-stacked',    label: 'Stacked Bar',       desc: 'Positive vs normal',     icon: '📶', color: '#8b5cf6' },
  { type: 'chart-line',       label: 'Line Chart',        desc: 'Trend over time',        icon: '📈', color: '#10b981' },
  { type: 'chart-area',       label: 'Area Chart',        desc: 'Filled trend view',      icon: '🏔', color: '#06b6d4' },
  { type: 'chart-combo',      label: 'Combo Chart',       desc: 'Bars with trend line',   icon: '📊', color: '#14b8a6' },
  { type: 'chart-stackedarea',label: 'Stacked Area',      desc: 'Layered distribution',   icon: '🏔', color: '#0ea5e9' },
  { type: 'chart-sparkline',  label: 'Sparkline',         desc: 'Compact trend summary',  icon: '➖', color: '#22c55e' },
  { type: 'chart-radar',      label: 'Radar Chart',       desc: 'Multi-metric profile',   icon: '🎯', color: '#a855f7' },
  { type: 'chart-pie',        label: 'Pie Chart',         desc: 'Outcome breakdown',      icon: '🥧', color: '#f59e0b' },
  { type: 'chart-donut',      label: 'Donut Chart',       desc: 'Test type split',        icon: '🍩', color: '#ec4899' },
  { type: 'chart-radialbar',  label: 'Radial Bar',        desc: 'Progress by camp',       icon: '🎯', color: '#f97316' },
  { type: 'chart-scatter',    label: 'Age Groups',        desc: 'Age distribution',       icon: '✦',  color: '#a78bfa' },
  { type: 'num',            label: 'Stat Block',    desc: 'Key numbers grid',     icon: '🔢', color: '#34d399' },
  { type: 'table',          label: 'Patient Table', desc: 'Records list',         icon: '📋', color: '#94a3b8' },
]

export default function BlockPanel({ variables, onAddBlock }) {
  function handleDragStart(e, type) {
    e.dataTransfer.setData('blockType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="block-panel">
      <div className="block-panel-header">
        <p className="block-panel-title">Builder Panel</p>
        <p className="block-panel-sub">Drag or click to add blocks</p>
      </div>

      <div className="block-section">
        <p className="block-section-label">Chart &amp; Data Blocks</p>
        <div className="block-list">
          {BLOCK_TYPES.map(block => (
            <button
              key={block.type}
              className="block-item"
              draggable
              onDragStart={e => handleDragStart(e, block.type)}
              onClick={() => onAddBlock(block.type)}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${block.color}18`
                e.currentTarget.style.borderColor = `${block.color}44`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div
                className="block-item-icon"
                style={{
                  background: `${block.color}22`,
                  border: `1px solid ${block.color}44`,
                }}
              >
                {block.icon}
              </div>
              <div>
                <p className="block-item-label">{block.label}</p>
                <p className="block-item-desc">{block.desc}</p>
              </div>
              <span className="block-item-drag">⠿</span>
            </button>
          ))}
        </div>
      </div>

      <div className="vars-section">
        <p className="block-section-label">Live Variables</p>
        <div className="vars-list">
          {variables?.map(v => (
            <div key={v.key} className="var-row">
              <span className="var-label">{v.label}</span>
              <span className="var-value">{v.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
