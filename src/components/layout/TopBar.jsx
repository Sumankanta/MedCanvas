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
  dashboardTitle, onUpdateDashboardTitle,
  isPreviewMode, onSetPreviewMode,
  onUndo, onRedo, canUndo, canRedo,
  zoom, onZoom, leftOpen, rightOpen, onToggleLeft, onToggleRight,
  onApplyTemplate,
  onSaveDraft,
  onExport,
  isExporting = false,
}) {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

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
        <div className="topbar-title-wrap">
          <span className="breadcrumb">Dashboard Builder</span>
          <span className="breadcrumb-sep">&gt;</span>
          {isEditingTitle ? (
            <input
              autoFocus
              className="breadcrumb current"
              style={{ border: '1px solid #d0d5dd', background: 'transparent', padding: '2px 6px', borderRadius: '4px', width: '250px', outline: 'none' }}
              value={dashboardTitle}
              onChange={(e) => onUpdateDashboardTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <>
              <span className="breadcrumb current" onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>
                {dashboardTitle || 'Untitled Dashboard'}
              </span>
              <button className="icon-btn" title="Rename dashboard" onClick={() => setIsEditingTitle(true)}>
                <PenLine size={13} />
              </button>
            </>
          )}
          <span className="draft-badge">Draft</span>
        </div>
      </div>

      <div className="topbar-center topbar-center--main">
        <button className={`mode-btn ${!isPreviewMode ? 'active' : ''}`} onClick={() => onSetPreviewMode(false)}>Design</button>
        <button className={`mode-btn ${isPreviewMode ? 'active' : ''}`} onClick={() => onSetPreviewMode(true)}>Preview</button>
        <button className="mode-btn"><Eye size={13} /> Settings</button>
      </div>

      <div className="topbar-right">
        <button className={`panel-toggle-btn ${leftOpen ? 'active' : ''}`} onClick={onToggleLeft} title={leftOpen ? 'Hide widgets panel' : 'Show widgets panel'}>
          <PanelLeft size={14} />
          <span>Widgets</span>
        </button>
        <button className={`panel-toggle-btn ${rightOpen ? 'active' : ''}`} onClick={onToggleRight} title={rightOpen ? 'Hide properties panel' : 'Show properties panel'}>
          <PanelRight size={14} />
          <span>Properties</span>
        </button>

        <button className="btn btn-ghost" onClick={onSaveDraft} title="Save draft">
          <RefreshCw size={14} />
          <span>Save Draft</span>
        </button>

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
