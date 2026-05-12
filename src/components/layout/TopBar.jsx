import { useState } from 'react'
import {
  CircleDot,
  Download,
  LayoutTemplate,
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
  onApplyTemplate,
  onExport,
  isExporting = false,
}) {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const time = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const templateCards = [
    { id: 'starter', title: 'Starter', desc: 'Balanced first dashboard', blocks: [2, 2, 2, 4, 4] },
    { id: 'kpi', title: 'KPI Focus', desc: 'Top KPI + trend rows', blocks: [1, 1, 1, 1, 3, 3] },
    { id: 'compare', title: 'Compare', desc: 'Side-by-side camp compare', blocks: [2, 2, 2, 3, 3] },
  ]

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
        <div className="template-pop-wrap">
          <button
            className="btn btn-ghost"
            onClick={() => setTemplateOpen((v) => !v)}
            title="Choose dashboard template"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <LayoutTemplate size={14} />
            Templates
          </button>
          {templateOpen && (
            <div className="template-popover">
              <div className="template-popover-head">Choose a layout</div>
              <div className="template-grid">
                {templateCards.map((tpl) => (
                  <button
                    key={tpl.id}
                    className="template-card"
                    onClick={() => { onApplyTemplate(tpl.id); setTemplateOpen(false) }}
                  >
                    <div className="template-preview">
                      {tpl.blocks.map((b, i) => (
                        <span key={`${tpl.id}-${i}`} style={{ gridColumn: `span ${b}` }} />
                      ))}
                    </div>
                    <div className="template-title">{tpl.title}</div>
                    <div className="template-desc">{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="btn btn-red" onClick={onClear} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={14} />
          Clear
        </button>
        <div className="template-pop-wrap">
          <button
            className="btn btn-cyan"
            onClick={() => setExportOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            disabled={isExporting}
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {exportOpen && (
            <div className="template-popover" style={{ width: 184, right: 0, left: 'auto' }}>
              <div className="template-popover-head">Export format</div>
              <div className="template-grid" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
                <button className="template-card" onClick={() => { onExport?.('pdf'); setExportOpen(false) }}>
                  <div className="template-title">Export PDF</div>
                  <div className="template-desc">Printable snapshot</div>
                </button>
                <button className="template-card" onClick={() => { onExport?.('jpg'); setExportOpen(false) }}>
                  <div className="template-title">Export JPG</div>
                  <div className="template-desc">Image snapshot</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
