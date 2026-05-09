import { useMemo, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, GripVertical, Plus,
  Trash2, Pencil, Check, X as XIcon, BarChart3,
} from 'lucide-react'
import CanvasBlock from './CanvasBlock'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function defaultSize(type) {
  if (type?.startsWith('stat-')) return { w: 300, h: 180 }
  return { w: 360, h: 380 }
}

function BlockItem({ block, data, selected, onSelect, onRemove, onDuplicate, onUpdateBlock, canvasRef }) {
  const props = block.props || {}
  const defaults = defaultSize(block.type)
  const x = Number(props.x ?? 16)
  const y = Number(props.y ?? 16)
  const w = Number(props.width ?? defaults.w)
  const h = Number(props.height ?? defaults.h)

  function onDragStart(e) {
    e.preventDefault()
    e.stopPropagation()
    onSelect(block.id)

    const startX = e.clientX
    const startY = e.clientY
    const startLeft = x
    const startTop = y

    function move(ev) {
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return
      const nextX = clamp(startLeft + (ev.clientX - startX), 0, Math.max(0, rect.width - w))
      const nextY = clamp(startTop + (ev.clientY - startY), 0, 3000)
      onUpdateBlock(block.id, { x: Math.round(nextX), y: Math.round(nextY) })
    }

    function up() {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  function onResizeStart(e) {
    e.preventDefault()
    e.stopPropagation()
    onSelect(block.id)

    const startX = e.clientX
    const startY = e.clientY
    const startW = w
    const startH = h

    function move(ev) {
      const nextW = clamp(startW + (ev.clientX - startX), 180, 1200)
      const nextH = clamp(startH + (ev.clientY - startY), block.type?.startsWith('stat-') ? 120 : 180, 1000)
      onUpdateBlock(block.id, { width: Math.round(nextW), height: Math.round(nextH) })
    }

    function up() {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div
      className={`abs-widget${selected ? ' abs-widget--selected' : ''}`}
      style={{ left: x, top: y, width: w, height: h }}
      onMouseDown={() => onSelect(block.id)}
    >
      <div className="abs-widget-drag" onMouseDown={onDragStart} title="Drag to move">
        <GripVertical size={12} />
      </div>

      <CanvasBlock
        block={block}
        data={data}
        selected={selected}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onSelect={() => onSelect(block.id)}
      />

      <div className="abs-widget-resize" onMouseDown={onResizeStart} title="Drag to resize">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M10 1L1 10" stroke="rgba(6,182,212,0.9)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 5.5L5.5 10" stroke="rgba(6,182,212,0.9)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

export default function CanvasSection({
  section, data, selectedId,
  onSelect, onUpdateBlock, onRemoveBlock, onDuplicateBlock,
  onUpdateSection, onRemoveSection,
  onAddBlockToSection,
  dragHandleProps, isDraggingSection,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title || 'Section')
  const [isDragOver, setIsDragOver] = useState(false)
  const canvasRef = useRef(null)

  const blocks = section.blocks || []

  const sectionHeight = useMemo(() => {
    if (blocks.length === 0) return 240
    const maxBottom = blocks.reduce((acc, b) => {
      const d = defaultSize(b.type)
      const by = Number(b.props?.y ?? 16)
      const bh = Number(b.props?.height ?? d.h)
      return Math.max(acc, by + bh)
    }, 0)
    return Math.max(260, maxBottom + 16)
  }, [blocks])

  function handleSectionDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('blockType')
    if (!type) return

    const rect = canvasRef.current?.getBoundingClientRect()
    const dropX = rect ? e.clientX - rect.left : 16
    const dropY = rect ? e.clientY - rect.top : 16

    onAddBlockToSection(section.id, type, 0, {
      x: Math.max(0, Math.round(dropX - 150)),
      y: Math.max(0, Math.round(dropY - 80)),
    })
  }

  function commitTitle() {
    const trimmed = titleDraft.trim() || 'Section'
    onUpdateSection(section.id, { title: trimmed })
    setTitleDraft(trimmed)
    setEditingTitle(false)
  }

  return (
    <div
      className={`canvas-section${isDraggingSection ? ' section--dragging' : ''}${isDragOver ? ' section--dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={handleSectionDrop}
    >
      <div className="section-header">
        <button className="section-drag-handle" {...dragHandleProps} title="Drag section">
          <GripVertical size={14} />
        </button>

        <button className="section-collapse-btn" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>

        <div className="section-title-wrap">
          {editingTitle ? (
            <div className="section-title-editor">
              <input
                className="section-title-input"
                value={titleDraft}
                autoFocus
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') { setTitleDraft(section.title || 'Section'); setEditingTitle(false) }
                }}
              />
              <button className="section-title-confirm" onClick={commitTitle}><Check size={11} /></button>
              <button className="section-title-cancel" onClick={() => { setTitleDraft(section.title || 'Section'); setEditingTitle(false) }}><XIcon size={11} /></button>
            </div>
          ) : (
            <span className="section-title" onDoubleClick={() => setEditingTitle(true)} title="Double-click to rename">
              {section.title || 'Section'}
            </span>
          )}
        </div>

        <span className="section-block-count">
          {blocks.length} widget{blocks.length !== 1 ? 's' : ''}
        </span>

        {!editingTitle && (
          <button className="section-action-btn" onClick={() => setEditingTitle(true)} title="Rename">
            <Pencil size={12} />
          </button>
        )}

        <button
          className="section-action-btn section-action-btn--danger"
          onClick={() => onRemoveSection(section.id)}
          title="Remove section"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {!collapsed && (
        <div className="section-body">
          {blocks.length === 0 ? (
            <div className={`section-empty${isDragOver ? ' drag-over' : ''}`}>
              <BarChart3 size={20} style={{ color: '#334155' }} />
              <p className="section-empty-text">
                {isDragOver ? 'Drop widget here' : 'Drag charts or stats from the right panel'}
              </p>
              <button
                className="section-add-first-btn"
                onClick={() => onAddBlockToSection(section.id, 'chart-bar', 0, { x: 24, y: 24 })}
              >
                <Plus size={12} /> Add Bar Chart
              </button>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className={`section-free-canvas${isDragOver ? ' section-free-canvas--over' : ''}`}
              style={{ minHeight: sectionHeight }}
              onClick={(e) => { if (e.target === e.currentTarget) onSelect(null) }}
            >
              {blocks.map((block) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  data={data}
                  selected={selectedId === block.id}
                  onSelect={onSelect}
                  onRemove={() => onRemoveBlock(block.id)}
                  onDuplicate={() => onDuplicateBlock(block.id, section.id)}
                  onUpdateBlock={onUpdateBlock}
                  canvasRef={canvasRef}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div className="section-collapsed-bar" onClick={() => setCollapsed(false)}>
          <ChevronRight size={12} />
          <span>{blocks.length} hidden widget{blocks.length !== 1 ? 's' : ''} - click to expand</span>
        </div>
      )}
    </div>
  )
}
