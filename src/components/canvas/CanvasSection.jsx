import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, GripVertical, Plus,
  Trash2, Pencil, Check, X as XIcon, BarChart3,
} from 'lucide-react'
import CanvasBlock from './CanvasBlock'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function defaultSize(type) {
  if (type?.startsWith('stat-')) return { w: 312, h: 192 }
  return { w: 360, h: 384 }
}

function minWidthForType(type) {
  return type?.startsWith('stat-') ? 120 : 192
}

function minHeightForType(type) {
  return type?.startsWith('stat-') ? 120 : 192
}

function rectOverlaps(a, b) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  )
}

function resolveNoOverlap(candidate, others) {
  const step = 24
  const next = { ...candidate }
  let guard = 0
  while (others.some((r) => rectOverlaps(next, r)) && guard < 500) {
    next.y += step
    guard += 1
  }
  return next
}

function packWithoutOverlap(items, canvasWidth) {
  const padding = 24
  const gap = 24
  const step = 24
  const maxW = Math.max(216, canvasWidth - (padding * 2))
  const placed = []
  const out = []

  const sorted = [...items].sort((a, b) => (a.y - b.y) || (a.x - b.x))

  for (const item of sorted) {
    const w = Math.max(minWidthForType(item.type), Math.min(item.w, maxW))
    const h = Math.max(120, item.h)
    const maxX = Math.max(padding, canvasWidth - w - padding)

    let found = null
    const startY = Math.max(padding, item.y)
    const endY = startY + 2600
    for (let y = startY; y <= endY && !found; y += step) {
      for (let x = padding; x <= maxX; x += step) {
        const cand = { id: item.id, type: item.type, x, y, w, h }
        if (!placed.some((p) => rectOverlaps(cand, p))) {
          found = cand
          break
        }
      }
    }

    if (!found) {
      const bottom = placed.reduce((m, p) => Math.max(m, p.y + p.h), padding)
      found = { id: item.id, type: item.type, x: padding, y: bottom + gap, w, h }
    }

    placed.push(found)
    out.push(found)
  }

  return out
}

const BlockItem = memo(function BlockItem({ block, data, selected, onSelect, onRemove, onDuplicate, onUpdateBlock, canvasRef, canvasWidth, otherRects, snapValue, isPreviewMode = false }) {
  const props = block.props || {}
  const defaults = defaultSize(block.type)
  const [liveRect, setLiveRect] = useState({
    x: Number(props.x ?? 24),
    y: Number(props.y ?? 24),
    w: Number(props.width ?? defaults.w),
    h: Number(props.height ?? defaults.h),
  })

  const x = liveRect.x
  const y = liveRect.y
  const w = liveRect.w
  const h = liveRect.h
  const liveRectRef = useRef(liveRect)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    setLiveRect({
      x: Number(props.x ?? 24),
      y: Number(props.y ?? 24),
      w: Number(props.width ?? defaults.w),
      h: Number(props.height ?? defaults.h),
    })
  }, [props.x, props.y, props.width, props.height, defaults.w, defaults.h])

  useEffect(() => {
    liveRectRef.current = liveRect
  }, [liveRect])

  useEffect(() => {
    if (!canvasWidth || canvasWidth <= 0) return
    const minW = minWidthForType(block.type)
    const maxW = Math.max(minW, canvasWidth - 16)
    const nextW = clamp(liveRectRef.current.w, minW, maxW)
    const nextX = clamp(liveRectRef.current.x, 0, Math.max(0, canvasWidth - nextW))
    if (nextW !== liveRectRef.current.w || nextX !== liveRectRef.current.x) {
      const next = { ...liveRectRef.current, w: nextW, x: nextX }
      liveRectRef.current = next
      setLiveRect(next)
      onUpdateBlock(block.id, { x: nextX, width: nextW }, { skipHistory: true })
    }
  }, [block.id, canvasWidth, onUpdateBlock])

  function onDragStart(e) {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(block.id)

    const startX = e.clientX
    const startY = e.clientY
    const startLeft = x
    const startTop = y
    setIsDragging(true)

    function move(ev) {
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return
      const rawX = startLeft + (ev.clientX - startX)
      const rawY = startTop + (ev.clientY - startY)
      const snappedX = snapValue ? snapValue(rawX) : rawX
      const snappedY = snapValue ? snapValue(rawY) : rawY
      const nextX = clamp(snappedX, 0, Math.max(0, rect.width - w))
      const nextY = clamp(snappedY, 0, 3000)
      const placed = resolveNoOverlap({ x: Math.round(nextX), y: Math.round(nextY), w, h }, otherRects)
      setLiveRect((prev) => ({
        ...prev,
        x: placed.x,
        y: placed.y,
      }))
    }

    function up() {
      const finalRect = liveRectRef.current
      onUpdateBlock?.(block.id, { x: finalRect.x, y: finalRect.y })
      setIsDragging(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  function onResizeStart(e) {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(block.id)

    const startX = e.clientX
    const startY = e.clientY
    const startW = w
    const startH = h
    setIsResizing(true)

    function move(ev) {
      const rawW = startW + (ev.clientX - startX)
      const rawH = startH + (ev.clientY - startY)
      const snappedW = snapValue ? snapValue(rawW) : rawW
      const snappedH = snapValue ? snapValue(rawH) : rawH
      const nextW = clamp(snappedW, minWidthForType(block.type), 1200)
      const nextH = clamp(snappedH, minHeightForType(block.type), 1000)
      const placed = resolveNoOverlap({ x, y, w: Math.round(nextW), h: Math.round(nextH) }, otherRects)
      setLiveRect((prev) => ({
        ...prev,
        w: placed.w,
        h: placed.h,
        y: placed.y,
      }))
    }

    function up() {
      const finalRect = liveRectRef.current
      onUpdateBlock?.(block.id, { width: finalRect.w, height: finalRect.h })
      setIsResizing(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const guides = useMemo(() => {
    if (!isDragging && !isResizing) return { v: [], h: [] }
    const current = liveRect
    const vGuides = new Set()
    const hGuides = new Set()
    
    // Check points for 'current'
    const currL = current.x
    const currR = current.x + current.w
    const currCX = current.x + current.w / 2
    const currT = current.y
    const currB = current.y + current.h
    const currCY = current.y + current.h / 2
    
    const TOLERANCE = 1
    
    for (const r of otherRects) {
      const rL = r.x
      const rR = r.x + r.w
      const rCX = r.x + r.w / 2
      const rT = r.y
      const rB = r.y + r.h
      const rCY = r.y + r.h / 2
      
      // Vertical alignments
      if (Math.abs(currL - rL) <= TOLERANCE || Math.abs(currL - rR) <= TOLERANCE) vGuides.add(currL)
      if (Math.abs(currR - rL) <= TOLERANCE || Math.abs(currR - rR) <= TOLERANCE) vGuides.add(currR)
      if (Math.abs(currCX - rCX) <= TOLERANCE) vGuides.add(currCX)
      
      // Horizontal alignments
      if (Math.abs(currT - rT) <= TOLERANCE || Math.abs(currT - rB) <= TOLERANCE) hGuides.add(currT)
      if (Math.abs(currB - rT) <= TOLERANCE || Math.abs(currB - rB) <= TOLERANCE) hGuides.add(currB)
      if (Math.abs(currCY - rCY) <= TOLERANCE) hGuides.add(currCY)
    }
    
    return {
      v: Array.from(vGuides),
      h: Array.from(hGuides)
    }
  }, [liveRect, isDragging, isResizing, otherRects])

  return (
    <>
      <div
        className={`abs-widget${selected ? ' abs-widget--selected' : ''}${isHovered ? ' abs-widget--hovered' : ''}${isDragging ? ' abs-widget--dragging' : ''}${isResizing ? ' abs-widget--resizing' : ''}`}
        style={{ left: x, top: y, width: w, height: h }}
        onMouseDown={() => onSelect?.(block.id)}
        onClick={(e) => { e.stopPropagation(); onSelect?.(block.id) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >


        <CanvasBlock
          block={block}
          data={data}
          selected={selected}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onDragStart={onDragStart}
          onSelect={() => onSelect?.(block.id)}
          liveWidth={isPreviewMode ? (canvasWidth || w) : w}
          liveHeight={isPreviewMode ? Math.max(250, h) : h}
          isPreviewMode={isPreviewMode}
        />

        {!isPreviewMode && (
          <div className="abs-widget-resize" onMouseDown={onResizeStart} title="Drag to resize">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M10 1L1 10" stroke="rgba(6,182,212,0.9)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 5.5L5.5 10" stroke="rgba(6,182,212,0.9)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          </div>
        )}
      </div>
      
      {(isDragging || isResizing) && guides.v.map(gx => (
        <div key={`v-${gx}`} className="snap-guide snap-guide--v" style={{ left: gx }} />
      ))}
      {(isDragging || isResizing) && guides.h.map(gy => (
        <div key={`h-${gy}`} className="snap-guide snap-guide--h" style={{ top: gy }} />
      ))}
    </>
  )
})

export default function CanvasSection({
  section, data, selectedId,
  onSelect, onUpdateBlock, onRemoveBlock, onDuplicateBlock,
  onUpdateSection, onRemoveSection,
  onAddBlockToSection,
  dragHandleProps, isDraggingSection,
  snapToGrid, showGrid, gridSize = 24, snapValue,
  isPreviewMode = false,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title || 'Section')
  const [isDragOver, setIsDragOver] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const canvasRef = useRef(null)
  const isPackingRef = useRef(false)

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

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return undefined

    const update = () => setCanvasWidth(node.clientWidth || 0)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [blocks.length, collapsed])

  useEffect(() => {
    if (isPreviewMode) return
    if (!canvasWidth || canvasWidth < 220 || blocks.length <= 1 || isPackingRef.current) return

    const current = blocks.map((b) => {
      const d = defaultSize(b.type)
      return {
        id: b.id,
        x: Number(b.props?.x ?? 16),
        y: Number(b.props?.y ?? 16),
        w: Number(b.props?.width ?? d.w),
        h: Number(b.props?.height ?? d.h),
        type: b.type,
      }
    })

    const packed = packWithoutOverlap(current, canvasWidth)
    const changes = packed.filter((p) => {
      const c = current.find((x) => x.id === p.id)
      return !c || c.x !== p.x || c.y !== p.y || c.w !== p.w
    })
    if (changes.length === 0) return

    const packedById = Object.fromEntries(packed.map((p) => [p.id, p]))
    const nextBlocks = blocks.map((b) => {
      const p = packedById[b.id]
      if (!p) return b
      return {
        ...b,
        props: {
          ...b.props,
          x: p.x,
          y: p.y,
          width: p.w,
        },
      }
    })

    isPackingRef.current = true
    onUpdateSection(section.id, { blocks: nextBlocks }, { skipHistory: true })
    const timer = window.setTimeout(() => {
      isPackingRef.current = false
    }, 0)
    return () => window.clearTimeout(timer)
  }, [blocks, canvasWidth, onUpdateSection, section.id, isPreviewMode])

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
      className={`canvas-section${isDraggingSection ? ' section--dragging' : ''}${isDragOver ? ' section--dragover' : ''}${isPreviewMode ? ' section--preview' : ''}`}
      onDragOver={isPreviewMode ? undefined : (e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={isPreviewMode ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={isPreviewMode ? undefined : handleSectionDrop}
    >
      <div className="section-header">
        {!isPreviewMode ? (
          <button className="section-drag-handle" {...dragHandleProps} title="Drag section">
            <GripVertical size={14} />
          </button>
        ) : (
          <div className="section-preview-mark" aria-hidden="true" />
        )}

        <button className="section-collapse-btn" onClick={() => !isPreviewMode && setCollapsed((c) => !c)} disabled={isPreviewMode}>
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
            <span className="section-title" onDoubleClick={() => !isPreviewMode && setEditingTitle(true)} title={isPreviewMode ? 'Preview mode' : 'Double-click to rename'}>
              {section.title || 'Section'}
            </span>
          )}
        </div>

        <span className="section-block-count">
          {blocks.length} widget{blocks.length !== 1 ? 's' : ''}
        </span>

        {!editingTitle && !isPreviewMode && (
          <button className="section-action-btn" onClick={() => setEditingTitle(true)} title="Rename">
            <Pencil size={12} />
          </button>
        )}

        {!isPreviewMode && (
          <button
            className="section-action-btn section-action-btn--danger"
            onClick={() => onRemoveSection(section.id)}
            title="Remove section"
          >
            <Trash2 size={12} />
          </button>
        )}
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
                onClick={() => !isPreviewMode && onAddBlockToSection(section.id, 'chart-bar', 0, { x: 24, y: 24 })}
                disabled={isPreviewMode}
              >
                <Plus size={12} /> Add Bar Chart
              </button>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className={`section-free-canvas${isDragOver ? ' section-free-canvas--over' : ''}${showGrid ? ' section-free-canvas--grid' : ''}${isPreviewMode ? ' section-free-canvas--preview' : ''}`}
              style={{
                minHeight: sectionHeight,
                ...(showGrid ? {
                  '--grid-size': `${gridSize}px`,
                } : {}),
              }}
              onClick={(e) => { if (!isPreviewMode && e.target === e.currentTarget) onSelect?.(null) }}
            >
              {blocks.map((block) => (
                (() => {
                  const d = defaultSize(block.type)
                  const otherRects = blocks
                    .filter((b) => b.id !== block.id)
                    .map((b) => {
                      const bd = defaultSize(b.type)
                      return {
                        x: Number(b.props?.x ?? 16),
                        y: Number(b.props?.y ?? 16),
                        w: Number(b.props?.width ?? bd.w),
                        h: Number(b.props?.height ?? bd.h),
                      }
                    })
                  return (
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
                  canvasWidth={canvasWidth}
                  otherRects={otherRects}
                  snapValue={snapValue}
                  isPreviewMode={isPreviewMode}
                />
                  )
                })()
              ))}
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div className="section-collapsed-bar" onClick={() => !isPreviewMode && setCollapsed(false)}>
          <ChevronRight size={12} />
          <span>{blocks.length} hidden widget{blocks.length !== 1 ? 's' : ''} - click to expand</span>
        </div>
      )}
    </div>
  )
}
