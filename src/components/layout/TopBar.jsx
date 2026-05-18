import { useState } from 'react'
import {
  ChevronDown,
  Eye,
  HeartPulse,
  Minus,
  Monitor,
  PanelLeft,
  PanelRight,
  PenLine,
  Redo,
  RefreshCw,
  Settings,
  Smartphone,
  Tablet,
  Undo,
  ZoomIn,
} from 'lucide-react'

export default function TopBar({
  onRefresh, onUndo, onRedo, canUndo, canRedo,
  zoom, onZoom, leftOpen, rightOpen, onToggleLeft, onToggleRight,
  onApplyTemplate,
  onExport,
  isExporting = false,
}) {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const templateCards = [
    { id: 'starter', title: 'Medical Drive', desc: 'Matches the monitoring view', blocks: [1, 1, 1, 1, 3, 3] },
    { id: 'kpi', title: 'KPI Focus', desc: 'Top metrics with trends', blocks: [1, 1, 1, 1, 3, 3] },
    { id: 'compare', title: 'Compare', desc: 'Side-by-side camp compare', blocks: [2, 2, 2, 3, 3] },
  ]

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark"><HeartPulse size={22} /></div>
        <div className="brand-copy">
          <span className="brand-name">PHC Platform</span>
          <span className="brand-subtitle">Medical Drive</span>
        </div>
        <span className="breadcrumb">Dashboard Builder</span>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb current">Medical Drive Monitoring Dashboard</span>
        <button className="icon-btn" title="Rename dashboard"><PenLine size={13} /></button>
        <span className="draft-badge">Draft</span>
      </div>

      <div className="topbar-center">
        <button className="mode-btn active">Design</button>
        <button className="mode-btn">Preview</button>
        <button className="mode-btn"><Eye size={13} /> Settings</button>
      </div>

      <div className="topbar-right">
        <div className="toolbar-group responsive-switcher">
          <button className="tb-btn active" title="Desktop"><Monitor size={14} /></button>
          <button className="tb-btn" title="Tablet"><Tablet size={14} /></button>
          <button className="tb-btn" title="Mobile"><Smartphone size={14} /></button>
        </div>

        <div className="toolbar-group">
          <button className="tb-btn" onClick={onUndo} disabled={!canUndo} title="Undo" style={{ opacity: canUndo ? 1 : 0.35 }}>
            <Undo size={14} />
          </button>
          <button className="tb-btn" onClick={onRedo} disabled={!canRedo} title="Redo" style={{ opacity: canRedo ? 1 : 0.35 }}>
            <Redo size={14} />
          </button>
        </div>

        <div className="toolbar-group zoom-group">
          <button className="tb-btn" onClick={() => onZoom((z) => Math.max(50, z - 10))} title="Zoom out">
            <Minus size={14} />
          </button>
          <span className="zoom-display">{zoom}%</span>
          <button className="tb-btn" onClick={() => onZoom((z) => Math.min(150, z + 10))} title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button className="fit-btn" onClick={() => onZoom(100)}>Fit Width</button>
        </div>

        <button className={`panel-toggle-btn ${leftOpen ? 'active' : ''}`} onClick={onToggleLeft} title={leftOpen ? 'Hide widgets panel' : 'Show widgets panel'}>
          <PanelLeft size={14} />
          <span>Widgets</span>
        </button>
        <button className={`panel-toggle-btn ${rightOpen ? 'active' : ''}`} onClick={onToggleRight} title={rightOpen ? 'Hide properties panel' : 'Show properties panel'}>
          <PanelRight size={14} />
          <span>Properties</span>
        </button>

        <button className="btn btn-ghost" onClick={onRefresh} title="Save draft">
          <RefreshCw size={14} />
          Save Draft
        </button>

        <div className="template-pop-wrap">
          <button className="btn btn-ghost" onClick={() => setTemplateOpen((v) => !v)}>
            Layout
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
                      {tpl.blocks.map((b, i) => <span key={`${tpl.id}-${i}`} style={{ gridColumn: `span ${b}` }} />)}
                    </div>
                    <div className="template-title">{tpl.title}</div>
                    <div className="template-desc">{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="template-pop-wrap">
          <button className="btn btn-cyan" onClick={() => setPublishOpen((v) => !v)} disabled={isExporting}>
            {isExporting ? 'Publishing...' : 'Publish'}
          </button>
          {publishOpen && (
            <div className="template-popover" style={{ width: 184, right: 0, left: 'auto' }}>
              <div className="template-popover-head">Export format</div>
              <div className="template-grid" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
                <button className="template-card" onClick={() => { onExport?.('pdf'); setPublishOpen(false) }}>
                  <div className="template-title">Export PDF</div>
                  <div className="template-desc">Printable snapshot</div>
                </button>
                <button className="template-card" onClick={() => { onExport?.('jpg'); setPublishOpen(false) }}>
                  <div className="template-title">Export JPG</div>
                  <div className="template-desc">Image snapshot</div>
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="avatar-btn" title="Account">SK <ChevronDown size={12} /></button>
      </div>
    </header>
  )
}
