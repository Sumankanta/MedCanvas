import {
  CircleDot,
  Download,
  Minus,
  PanelLeft,
  PanelRight,
  Redo,
  RefreshCw,
  Trash2,
  Undo,
  ZoomIn,
} from 'lucide-react'

export default function TopBar({
  campInfo, blockCount, lastUpdated, isRefreshing,
  onRefresh, onClear, onUndo, onRedo, canUndo, canRedo,
  zoom, onZoom, leftOpen, rightOpen, onToggleLeft, onToggleRight,
}) {
  const time = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-icon">M</div>
        <span className="brand-name">MedDrive</span>
        <div className="brand-divider" />
        <span className="brand-page">Dashboard Builder</span>
      </div>

      <div className="topbar-center">
        {campInfo && <span className="topbar-pill pill-org">{campInfo.name}</span>}
        <span className="topbar-pill pill-live"><CircleDot size={10} style={{ marginRight: 4 }} />Live</span>
        <span className="topbar-pill pill-blocks">{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
        {time && <span className="topbar-pill pill-time">Updated {time}</span>}
      </div>

      <div className="topbar-right">
        <div className="toolbar-group">
          <button className={`tb-btn ${leftOpen ? 'active' : ''}`} onClick={onToggleLeft} title="Toggle properties panel">
            <PanelLeft size={14} />
          </button>
          <button className={`tb-btn ${rightOpen ? 'active' : ''}`} onClick={onToggleRight} title="Toggle charts panel">
            <PanelRight size={14} />
          </button>
        </div>

        <div className="toolbar-group">
          <button className="tb-btn" onClick={() => onZoom((z) => Math.max(50, z - 10))} title="Zoom out">
            <Minus size={14} />
          </button>
          <span className="zoom-display">{zoom}%</span>
          <button className="tb-btn" onClick={() => onZoom((z) => Math.min(150, z + 10))} title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button className="tb-btn" onClick={() => onZoom(100)} title="Reset zoom" style={{ fontSize: 9 }}>100</button>
        </div>

        <div className="toolbar-group">
          <button className="tb-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.3 }}>
            <Undo size={14} />
          </button>
          <button className="tb-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{ opacity: canRedo ? 1 : 0.3 }}>
            <Redo size={14} />
          </button>
        </div>

        <button className="btn btn-ghost" onClick={onRefresh} title="Refresh data" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} className={isRefreshing ? 'spin-slow' : ''} />
          Refresh
        </button>
        <button className="btn btn-red" onClick={onClear} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={14} />
          Clear
        </button>
        <button className="btn btn-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} />
          Export PDF
        </button>
      </div>
    </header>
  )
}
