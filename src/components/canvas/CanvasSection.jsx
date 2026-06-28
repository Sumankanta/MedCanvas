import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, GripVertical, Plus,
  Trash2, Pencil, Check, X as XIcon, BarChart3,
} from 'lucide-react'
import CanvasBlock from './CanvasBlock'
 
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}
 
function isStatLike(type) {
  return type === 'kpi-card' || type?.startsWith('stat-')
}
 
function defaultSize(type) {
  if (isStatLike(type)) return { w: 194, h: 120 }
  if (type === 'table') return { w: 360, h: 300 }
  return { w: 360, h: 300 }
}
 
function minWidthForType(type) {
  if (isStatLike(type)) return 140
  if (type === 'table') return 240
  return 220
}
 
function minHeightForType(type) {
  if (isStatLike(type)) return 100
  if (type === 'table') return 220
  return 220
}
 
function maxHeightForType(type) {
  if (isStatLike(type)) return 150
  if (type === 'table') return 340
  return 320
}
 
function rectOverlaps(a, b) {
  // Use a 2px shrink to avoid false-positive overlaps from floating-point
  // rounding (e.g. x=361.5 treated as overlapping x=362).
  const EPSILON = 2
  return !(
    a.x + a.w <= b.x + EPSILON ||
    b.x + b.w <= a.x + EPSILON ||
    a.y + a.h <= b.y + EPSILON ||
    b.y + b.h <= a.y + EPSILON
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
 
function packWithoutOverlap(items, canvasWidth, { fromTop = false } = {}) {
  const padding = 24
  const gap = 24
  const step = 24
  const maxW = Math.max(216, canvasWidth - (padding * 2))
  const placed = []
  const out = []

  for (const item of items) {
    const w = Math.max(minWidthForType(item.type), Math.min(item.w, maxW))
    const h = Math.max(minHeightForType(item.type), Math.min(item.h, maxHeightForType(item.type)))
    const maxX = Math.max(padding, canvasWidth - w - padding)

    let found = null
    const startY = fromTop ? padding : Math.max(padding, item.y)
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

// Arranges items into a proper desktop grid layout so that switching from
// mobile/tablet back to desktop never collapses everything into a single row.
// Stat/KPI cards are placed in a wrapping horizontal row at the top.
// All other widgets (charts, tables) go into a 2-column grid below them.
// Items within each group are sorted by their original y then x so the
// relative visual order the user set up is preserved.
function packDesktopGrid(items, canvasWidth) {
  const padding = 24
  const rowGap = 20
  const colGap = 16

  const statItems = items
    .filter((i) => isStatLike(i.type))
    .slice()
    .sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x))

  const otherItems = items
    .filter((i) => !isStatLike(i.type))
    .slice()
    .sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x))

  const usable = Math.max(300, canvasWidth - padding * 2)
  const out = []

  // ── Stat cards: wrap into rows ──────────────────────────────────────
  let curX = padding
  let curY = padding
  let rowH = 0

  for (const item of statItems) {
    const w = Math.max(minWidthForType(item.type), Math.min(item.w, usable))
    const h = Math.max(minHeightForType(item.type), Math.min(item.h, maxHeightForType(item.type)))

    if (curX + w > canvasWidth - padding && curX > padding) {
      curX = padding
      curY += rowH + rowGap
      rowH = 0
    }

    out.push({ ...item, x: curX, y: curY, w, h })
    curX += w + colGap
    rowH = Math.max(rowH, h)
  }

  const chartsStartY = statItems.length > 0 ? curY + rowH + rowGap : padding

  // ── Charts / tables: 3-column grid ─────────────────────────────────
  const numCols = 3
  const colW = Math.floor((usable - colGap * (numCols - 1)) / numCols)
  const colX = Array.from({ length: numCols }, (_, i) => padding + i * (colW + colGap))
  const colY = Array.from({ length: numCols }, () => chartsStartY)

  for (const item of otherItems) {
    const isFullWidth = item.type === 'table' || item.type === 'advanced-table' || item.type === 'pivot-table'
    const h = Math.max(minHeightForType(item.type), Math.min(item.h, maxHeightForType(item.type)))

    if (isFullWidth) {
      const y = Math.max(...colY)
      const w = Math.min(item.w, usable)
      out.push({ ...item, x: padding, y, w, h })
      const nextY = y + h + rowGap
      for (let i = 0; i < numCols; i++) colY[i] = nextY
    } else {
      const col = colY.indexOf(Math.min(...colY))
      const w = Math.max(minWidthForType(item.type), Math.min(item.w, colW))
      out.push({ ...item, x: colX[col], y: colY[col], w, h })
      colY[col] += h + rowGap
    }
  }

  return out
}

const RECT_KEYS_BY_MODE = {
  desktop: { x: 'x', y: 'y', w: 'width', h: 'height' },
  tablet: { x: 'tabletX', y: 'tabletY', w: 'tabletWidth', h: 'tabletHeight' },
  mobile: { x: 'mobileX', y: 'mobileY', w: 'mobileWidth', h: 'mobileHeight' },
}

function rectKeysFor(mode) {
  return RECT_KEYS_BY_MODE[mode] || RECT_KEYS_BY_MODE.desktop
}

// Build a "view block" whose .props.{x,y,width,height} reflect the active
// viewport. Falls back to desktop coordinates so existing layouts stay intact
// until the user moves a widget in the new viewport.
function viewBlockFor(block, mode) {
  if (mode === 'desktop') return block
  const keys = rectKeysFor(mode)
  const p = block.props || {}
  const fallback = defaultSize(block.type)
  return {
    ...block,
    props: {
      ...p,
      x: Number(p[keys.x] ?? p.x ?? 16),
      y: Number(p[keys.y] ?? p.y ?? 16),
      width: Number(p[keys.w] ?? p.width ?? fallback.w),
      height: Number(p[keys.h] ?? p.height ?? fallback.h),
    },
  }
}

// Translate a {x,y,width,height} patch into the active viewport's prop keys
// so we don't clobber the desktop layout while dragging on tablet/mobile.
function makeViewportUpdater(onUpdateBlock, mode) {
  if (mode === 'desktop') return onUpdateBlock
  const keys = rectKeysFor(mode)
  return (id, patch, options) => {
    const next = { ...patch }
    if ('x' in patch) { next[keys.x] = patch.x; delete next.x }
    if ('y' in patch) { next[keys.y] = patch.y; delete next.y }
    if ('width' in patch) { next[keys.w] = patch.width; delete next.width }
    if ('height' in patch) { next[keys.h] = patch.height; delete next.height }
    return onUpdateBlock(id, next, options)
  }
}
 
function buildResponsiveLayout(blocks, canvasWidth, responsiveMode, isPreviewMode) {
  // Desktop uses free absolute placement — widgets are positioned by findFreeSpot
  // and packDesktopGrid (3-col). Tablet uses a 2-column auto-flow grid; Mobile 1-col.
  // Widgets are sorted by their saved viewport y-coord (drag-to-reorder) then placed
  // deterministically into the column grid.
  if (!canvasWidth || responsiveMode === 'desktop') return null
  // eslint-disable-next-line no-unused-vars
  const _previewHint = isPreviewMode

  // Column count per responsive mode
  const columns = responsiveMode === 'mobile' ? 1 : 2

  // Geometry constants
  const padding = responsiveMode === 'mobile' ? 12 : 16
  const gap     = responsiveMode === 'mobile' ? 12 : 16

  // Sort blocks by their saved viewport-specific y then x coordinates so that
  // dragging a widget and saving a new tabletY / mobileY causes it to flow into
  // the correct position in the auto-grid on the next render.
  // Fallback chain:
  //   tablet  → tabletY  → desktopY
  //   mobile  → mobileY  → tabletY  → desktopY   (preserves tablet order on first switch)
  const sortKeys = rectKeysFor(responsiveMode)
  const getSortY = (p) => responsiveMode === 'mobile'
    ? Number(p?.[sortKeys.y] ?? p?.tabletY ?? p?.y ?? 0)
    : Number(p?.[sortKeys.y] ?? p?.y ?? 0)
  const getSortX = (p) => responsiveMode === 'mobile'
    ? Number(p?.[sortKeys.x] ?? p?.tabletX ?? p?.x ?? 0)
    : Number(p?.[sortKeys.x] ?? p?.x ?? 0)
  const sorted = [...blocks].sort((a, b) => {
    const ay = getSortY(a.props)
    const by_ = getSortY(b.props)
    const ax = getSortX(a.props)
    const bx = getSortX(b.props)
    return ay !== by_ ? ay - by_ : ax - bx
  })

  const previewMinWidth = responsiveMode === 'mobile' ? 280 : 704
  const layoutWidth = Math.max(canvasWidth, previewMinWidth)
  const usableWidth = Math.max(240, layoutWidth - (padding * 2))
  const columnWidth = Math.floor((usableWidth - (gap * (columns - 1))) / columns)
  const heights = Array.from({ length: columns }, () => padding)
  const rects = {}

  for (const block of sorted) {
    const defaults = defaultSize(block.type)
    const keys = rectKeysFor(responsiveMode)
    // Check for viewport-specific sizes first; fall back to desktop sizes
    const hasExplicitViewportH = block.props?.[keys.h] != null
    const savedW = Number(block.props?.[keys.w] ?? block.props?.width ?? defaults.w)
    const savedH = Number(block.props?.[keys.h] ?? block.props?.height ?? defaults.h)
    const isWideWidget = block.type === 'table' || block.type === 'advanced-table' || block.type === 'pivot-table'
    const span = columns === 1 || (isWideWidget && savedW > columnWidth * 1.05) || savedW > columnWidth * 1.35 ? columns : 1
    const slotWidth = span === columns ? usableWidth : columnWidth
    const scale = Math.max(0.72, Math.min(1.18, slotWidth / Math.max(savedW, defaults.w)))
    const minH = minHeightForType(block.type)
    const maxH = maxHeightForType(block.type)
    // When the user has explicitly resized in this viewport, respect that height
    // exactly. For auto-flow defaults, scale by width ratio and cap to keep tidy.
    const h = hasExplicitViewportH
      ? Math.round(clamp(savedH, minH, 1000))
      : Math.round(clamp(savedH * scale, minH, maxH))

    // Pick the shortest column for single-span widgets
    let col = 0
    if (span === 1 && columns > 1) {
      col = heights[0] <= heights[1] ? 0 : 1
    }

    const y = span === columns ? Math.max(...heights) : heights[col]
    const x = padding + (col * (columnWidth + gap))

    rects[block.id] = { x, y, w: slotWidth, h }

    if (span === columns) {
      const nextY = y + h + gap
      for (let i = 0; i < columns; i += 1) heights[i] = nextY
    } else {
      heights[col] = y + h + gap
    }
  }

  return {
    rects,
    height: Math.max(260, Math.max(...heights) + padding - gap),
  }
}
 
const BlockItem = memo(function BlockItem({ block, data, selected, onSelect, onRemove, onDuplicate, onUpdateBlock, canvasRef, canvasWidth, otherRects, snapValue, displayRect, zoom = 100, responsiveMode = 'desktop', isPreviewMode = false, filteredOut = false }) {
  const props = block.props || {}
  const defaults = defaultSize(block.type)
  const [liveRect, setLiveRect] = useState({
    x: Number(props.x ?? 24),
    y: Number(props.y ?? 24),
    w: Number(props.width ?? defaults.w),
    h: Number(props.height ?? defaults.h),
  })
  // resizeLive overrides displayRect visually during a resize drag in responsive mode
  const [resizeLive, setResizeLive] = useState(null)
  const resizeLiveRef = useRef(null)
  // dragLive overrides displayRect position during a drag in responsive mode
  const [dragLive, setDragLive] = useState(null)
  const dragLiveRef = useRef(null)
  // Direct DOM ref for immediate visual feedback during responsive resize/drag
  const widgetRef = useRef(null)
 
  const isResponsiveLayout = Boolean(displayRect)
  const x = dragLive?.x ?? displayRect?.x ?? liveRect.x
  const y = dragLive?.y ?? displayRect?.y ?? liveRect.y
  const w = resizeLive?.w ?? displayRect?.w ?? liveRect.w
  const h = resizeLive?.h ?? displayRect?.h ?? liveRect.h
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

  // Clear live overrides when the viewport mode changes.
  useEffect(() => {
    setResizeLive(null)
    setDragLive(null)
    dragLiveRef.current = null
  }, [responsiveMode])
 
  useEffect(() => {
    if (isResponsiveLayout || isPreviewMode) return
    if (!canvasWidth || canvasWidth <= 0) return
    // Read CURRENT viewport's coords from props (not from possibly-stale
    // liveRectRef). When switching viewport modes, props change before
    // canvasWidth catches up via ResizeObserver, and using the ref would
    // write the previous viewport's values into the new viewport's keys.
    const curX = Number(props.x ?? 24)
    const curW = Number(props.width ?? defaults.w)
    const minW = minWidthForType(block.type)
    const maxW = Math.max(minW, canvasWidth - 16)
    // Only clamp when the widget genuinely overflows the canvas. This avoids
    // shrinking widgets during the brief moment canvasWidth lags behind the
    // newly-selected viewport mode.
    if (curW <= maxW && curX + curW <= canvasWidth) return
    const nextW = clamp(curW, minW, maxW)
    const nextX = clamp(curX, 0, Math.max(0, canvasWidth - nextW))
    if (nextW !== curW || nextX !== curX) {
      onUpdateBlock(block.id, { x: nextX, width: nextW }, { skipHistory: true })
    }
  }, [block.id, block.type, canvasWidth, isResponsiveLayout, isPreviewMode, onUpdateBlock, props.x, props.width, defaults.w])
 
  function onDragStart(e) {
    if (isPreviewMode) return
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
     
      const zoomScale = zoom / 100
      const rawX = startLeft + (ev.clientX - startX) / zoomScale
      const rawY = startTop + (ev.clientY - startY) / zoomScale
     
      const snappedX = snapValue ? snapValue(rawX) : rawX
      const snappedY = snapValue ? snapValue(rawY) : rawY
      const nextX = clamp(snappedX, 0, Math.max(0, rect.width / zoomScale - w))
      const nextY = clamp(snappedY, 0, 3000)

      if (isResponsiveLayout) {
        // In auto-flow layout, bypass React state for instant visual feedback.
        // Snap is already applied via snappedX / snappedY above.
        const live = { x: Math.round(nextX), y: Math.round(nextY) }
        dragLiveRef.current = live
        // Also update state so the guides useMemo recomputes with current coords
        setDragLive(live)
        if (widgetRef.current) {
          widgetRef.current.style.left = `${live.x}px`
          widgetRef.current.style.top = `${live.y}px`
          widgetRef.current.style.transition = 'none'
          widgetRef.current.style.zIndex = '100'
        }
      } else {
        // Desktop resolves overlaps; tablet/mobile free canvas allows overlaps.
        const placed = responsiveMode === 'desktop'
          ? resolveNoOverlap({ x: Math.round(nextX), y: Math.round(nextY), w, h }, otherRects)
          : { x: Math.round(nextX), y: Math.round(nextY) }
        const nextRect = {
          ...liveRectRef.current,
          x: placed.x,
          y: placed.y,
        }
        liveRectRef.current = nextRect
        setLiveRect((prev) => ({
          ...prev,
          x: placed.x,
          y: placed.y,
        }))
      }
    }

    function up() {
      if (isResponsiveLayout) {
        const dl = dragLiveRef.current
        if (dl) {
          // Save the dragged y-coordinate as the viewport-specific sort key.
          // buildResponsiveLayout re-sorts blocks by tabletY/mobileY on the
          // next render and places them back into the correct column slot —
          // so this is "drag to reorder" within the auto-flow grid.
          onUpdateBlock(block.id, { x: dl.x, y: dl.y })
          dragLiveRef.current = null
        }
        // Clear drag-only inline styles. left/top will snap back to the grid
        // slot computed by buildResponsiveLayout on the next render.
        requestAnimationFrame(() => {
          if (widgetRef.current) {
            widgetRef.current.style.left = ''
            widgetRef.current.style.top = ''
            widgetRef.current.style.transition = ''
            widgetRef.current.style.zIndex = ''
          }
        })
        setDragLive(null)
      } else {
        const finalRect = liveRectRef.current
        // onUpdateBlock is already viewport-wrapped by CanvasSection — call directly.
        onUpdateBlock(block.id, { x: finalRect.x, y: finalRect.y })
      }
      setIsDragging(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
 
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
 
  function onResizeStart(e) {
    if (isPreviewMode) return
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(block.id)

    const startX = e.clientX
    const startY = e.clientY
    const startW = w
    const startH = h
    setIsResizing(true)

    function move(ev) {
      const zoomScale = zoom / 100
      const rawW = startW + (ev.clientX - startX) / zoomScale
      const rawH = startH + (ev.clientY - startY) / zoomScale

      const snappedW = snapValue ? snapValue(rawW) : rawW
      const snappedH = snapValue ? snapValue(rawH) : rawH
      const nextW = clamp(snappedW, minWidthForType(block.type), 1200)
      const nextH = clamp(snappedH, minHeightForType(block.type), 1000)

      if (isResponsiveLayout) {
        // Directly manipulate the DOM for instant visual feedback during drag
        // (bypasses React batching / CSS transition delays)
        const live = { w: Math.round(nextW), h: Math.round(nextH) }
        resizeLiveRef.current = live
        // Also update state so the guides useMemo recomputes with current size
        setResizeLive(live)
        if (widgetRef.current) {
          widgetRef.current.style.width = `${live.w}px`
          widgetRef.current.style.height = `${live.h}px`
          widgetRef.current.style.transition = 'none'
        }
      } else {
        // Desktop resolves overlaps on resize; tablet/mobile free canvas does not.
        const placed = responsiveMode === 'desktop'
          ? resolveNoOverlap({ x, y, w: Math.round(nextW), h: Math.round(nextH) }, otherRects)
          : { x, y, w: Math.round(nextW), h: Math.round(nextH) }
        const nextRect = {
          ...liveRectRef.current,
          w: placed.w,
          h: placed.h,
          y: placed.y,
        }
        liveRectRef.current = nextRect
        setLiveRect((prev) => ({
          ...prev,
          w: placed.w,
          h: placed.h,
          y: placed.y,
        }))
      }
    }

    function up() {
      if (isResponsiveLayout) {
        const lr = resizeLiveRef.current
        if (lr) {
          // onUpdateBlock is already wrapped by CanvasSection's viewportUpdater,
          // so pass generic width/height — it will be translated to tabletWidth/mobileHeight etc.
          onUpdateBlock(block.id, { width: lr.w, height: lr.h })
          // For responsive layout, only keep the HEIGHT in resizeLive so the
          // widget shows the user's resized height while buildResponsiveLayout
          // catches up. Width is always controlled by the column grid, so we
          // let displayRect.w take over immediately (React will overwrite the
          // drag's inline style.width with the correct column width).
          setResizeLive({ h: lr.h })
          resizeLiveRef.current = null
        }
        // Restore CSS transitions on next paint.
        // Do NOT clear width/height inline styles — React already owns those
        // via style={{ width, height }} (from displayRect / resizeLive).
        requestAnimationFrame(() => {
          if (widgetRef.current) {
            widgetRef.current.style.transition = ''
          }
        })
      } else {
        const finalRect = liveRectRef.current
        onUpdateBlock?.(block.id, { width: finalRect.w, height: finalRect.h })
      }
      setIsResizing(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
 
  const guides = useMemo(() => {
    if (!isDragging && !isResizing) return { v: [], h: [] }
    // In responsive mode use dragLive/resizeLive/displayRect for current coords;
    // in desktop mode fall back to liveRect (updated on every move via setState).
    const current = {
      x: dragLive?.x ?? displayRect?.x ?? liveRect.x,
      y: dragLive?.y ?? displayRect?.y ?? liveRect.y,
      w: resizeLive?.w ?? displayRect?.w ?? liveRect.w,
      h: resizeLive?.h ?? displayRect?.h ?? liveRect.h,
    }
    const vGuides = new Set()
    const hGuides = new Set()
   
    // Check points for 'current'
    const currL = current.x
    const currR = current.x + current.w
    const currCX = current.x + current.w / 2
    const currT = current.y
    const currB = current.y + current.h
    const currCY = current.y + current.h / 2
   
    // Show guides whenever we're within ~6px of alignment. The drag math
    // already snaps to the grid, so the live rect rarely lands exactly on
    // another widget's edge — using a larger tolerance ensures guides are
    // visible while the user is in the snap zone.
    const TOLERANCE = 6
   
    for (const r of otherRects) {
      const rL = r.x
      const rR = r.x + r.w
      const rCX = r.x + r.w / 2
      const rT = r.y
      const rB = r.y + r.h
      const rCY = r.y + r.h / 2
     
      // Vertical alignments — snap guide is drawn at the OTHER widget's edge
      // so the line aligns with what the user is matching.
      if (Math.abs(currL - rL) <= TOLERANCE) vGuides.add(rL)
      if (Math.abs(currL - rR) <= TOLERANCE) vGuides.add(rR)
      if (Math.abs(currR - rL) <= TOLERANCE) vGuides.add(rL)
      if (Math.abs(currR - rR) <= TOLERANCE) vGuides.add(rR)
      if (Math.abs(currCX - rCX) <= TOLERANCE) vGuides.add(rCX)
     
      // Horizontal alignments
      if (Math.abs(currT - rT) <= TOLERANCE) hGuides.add(rT)
      if (Math.abs(currT - rB) <= TOLERANCE) hGuides.add(rB)
      if (Math.abs(currB - rT) <= TOLERANCE) hGuides.add(rT)
      if (Math.abs(currB - rB) <= TOLERANCE) hGuides.add(rB)
      if (Math.abs(currCY - rCY) <= TOLERANCE) hGuides.add(rCY)
    }
   
    return {
      v: Array.from(vGuides),
      h: Array.from(hGuides)
    }
  }, [dragLive, resizeLive, displayRect, liveRect, isDragging, isResizing, otherRects])
 
  return (
    <>
      <div
        ref={widgetRef}
        className={`abs-widget${isResponsiveLayout ? ' abs-widget--responsive' : ''}${selected ? ' abs-widget--selected' : ''}${isHovered ? ' abs-widget--hovered' : ''}${isDragging ? ' abs-widget--dragging' : ''}${isResizing ? ' abs-widget--resizing' : ''}${filteredOut ? ' abs-widget--filtered' : ''}`}
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          opacity: filteredOut ? 0.28 : undefined,
          pointerEvents: filteredOut ? 'none' : undefined,
        }}
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
          liveWidth={resizeLive?.w ?? displayRect?.w ?? w}
          liveHeight={resizeLive?.h ?? displayRect?.h ?? h}
          responsiveMode={responsiveMode}
          isPreviewMode={isPreviewMode}
        />
 
        {!isPreviewMode && (isHovered || selected) && (
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
 
function shouldUseDateFilteredData(type) {
  if (type?.startsWith('stat-') || type === 'kpi-card' || type === 'num') return true
  return [
    'chart-bar',
    'chart-line',
    'chart-area',
    'chart-stacked',
    'chart-combo',
    'chart-stackedarea',
    'chart-sparkline',
    'chart-heatmap',
    'table',
    'advanced-table',
    'pivot-table',
  ].includes(type)
}
 
export default function CanvasSection({
  section, data, selectedId,
  sourceData,
  onSelect, onUpdateBlock, onRemoveBlock, onDuplicateBlock,
  onUpdateSection, onRemoveSection,
  onAddBlockToSection,
  widgetFilters = { chart: true, stat: true, table: true },
  dragHandleProps, isDraggingSection,
  showGrid, gridSize = 24, snapValue,
  zoom = 100,
  responsiveMode = 'desktop',
  isPreviewMode = false,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title || 'Section')
  const [isDragOver, setIsDragOver] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [isModeSwitchSettling, setIsModeSwitchSettling] = useState(false)
  // Track whether we recently switched viewport modes. The ResizeObserver fires
  // multiple times during a mode switch, and canvasWidth may temporarily report
  // a stale or transitional value. We suppress the auto-repack effect for a
  // short stabilization window to prevent the desktop layout from being rewritten.
  const modeSwitchTimerRef = useRef(null)
  const canvasRef = useRef(null)
  const blocks = section.blocks || []
  const getFilterKey = (type) => {
    if (type === 'table') return 'table'
    if (type?.startsWith('stat-') || type === 'num') return 'stat'
    if (type?.startsWith('chart-')) return 'chart'
    return 'chart'
  }
  const responsiveLayout = useMemo(
    () => buildResponsiveLayout(blocks, canvasWidth, responsiveMode, isPreviewMode),
    [blocks, canvasWidth, responsiveMode, isPreviewMode],
  )
 
  const sectionHeight = useMemo(() => {
    if (responsiveLayout?.height) return responsiveLayout.height
    if (blocks.length === 0) return 240
    const maxBottom = blocks.reduce((acc, b) => {
      const d = defaultSize(b.type)
      const view = viewBlockFor(b, responsiveMode)
      const by = Number(view.props?.y ?? 16)
      const bh = Number(view.props?.height ?? d.h)
      return Math.max(acc, by + bh)
    }, 0)
    return Math.max(260, maxBottom + 16)
  }, [blocks, responsiveLayout, responsiveMode])
 
  useEffect(() => {
    const node = canvasRef.current
    if (!node) return undefined
 
    const update = () => setCanvasWidth(node.clientWidth || 0)
    update()
 
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [blocks.length, collapsed, responsiveMode])

  // Set the stabilization flag whenever the viewport mode changes so the
  // repack effect won't fire during the ResizeObserver settling period.
  useEffect(() => {
    setIsModeSwitchSettling(true)
    clearTimeout(modeSwitchTimerRef.current)
    modeSwitchTimerRef.current = setTimeout(() => {
      setIsModeSwitchSettling(false)
    }, 800)
    return () => clearTimeout(modeSwitchTimerRef.current)
  }, [responsiveMode])
 
  // Auto-fix overlap and overflow. Runs in every viewport (desktop, tablet,
  // mobile) in Design mode whenever any widget overlaps another or extends
  // past the right edge of the current canvas. Writes to viewport-specific
  // prop keys so desktop coordinates are never overwritten by tablet/mobile
  // adjustments.
  useEffect(() => {
    if (isPreviewMode) return
    if (!canvasWidth || canvasWidth < 220 || blocks.length <= 1) return
    // Tablet/mobile use buildResponsiveLayout (auto-flow grid) — no repack needed.
    if (responsiveMode !== 'desktop') return
    // Desktop: don't repack until canvasWidth has settled.
    if (canvasWidth < 700) return
    // Suppress repack during the stabilization window after a mode switch.
    // The ResizeObserver fires stale widths during the CSS transition which
    // can incorrectly trigger overlap detection and rearrange the layout.
    if (isModeSwitchSettling) return

    const keys = rectKeysFor(responsiveMode)
    const padding = 16
    const usableRight = canvasWidth - padding

    const current = blocks.map((b) => {
      const view = viewBlockFor(b, responsiveMode)
      const d = defaultSize(b.type)
      return {
        id: b.id,
        x: Number(view.props.x ?? 16),
        y: Number(view.props.y ?? 16),
        w: Number(view.props.width ?? d.w),
        h: Number(view.props.height ?? d.h),
        type: b.type,
      }
    })

    const hasOverlap = current.some((a, i) =>
      current.some((b, j) => i !== j && rectOverlaps(a, b))
    )
    // Use a 2px tolerance so that sub-pixel layout differences from CSS
    // rounding or floating-point arithmetic don't trigger a full repack.
    const hasOverflow = current.some((r) => r.x + r.w > usableRight + 3)

    if (!hasOverlap && !hasOverflow) return

    // On desktop, never reflow purely for overflow — user controls width.
    if (responsiveMode === 'desktop' && !hasOverlap) return

    // When overlap exists (e.g. widgets added while in mobile inherited the
    // same default desktop coords), use the desktop grid packer which places
    // stat/KPI cards in wrapping rows at the top and charts/tables in a
    // 3-column grid below. This prevents everything collapsing into a single
    // horizontal row on wide canvases after switching back from mobile/tablet.
    const packed = responsiveMode === 'desktop'
      ? packDesktopGrid(current, canvasWidth)
      : packWithoutOverlap(current, canvasWidth, { fromTop: true })

    const changes = packed.filter((p) => {
      const c = current.find((x) => x.id === p.id)
      return !c || c.x !== p.x || c.y !== p.y || c.w !== p.w || c.h !== p.h
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
          [keys.x]: p.x,
          [keys.y]: p.y,
          [keys.w]: p.w,
          [keys.h]: p.h,
        },
      }
    })

    onUpdateSection(section.id, { blocks: nextBlocks }, { skipHistory: true })
  }, [blocks, canvasWidth, onUpdateSection, responsiveMode, section.id, isPreviewMode, responsiveLayout, isModeSwitchSettling])
 
  function handleSectionDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('blockType')
    if (!type) return
 
    const rect = canvasRef.current?.getBoundingClientRect()
    const dropX = rect ? e.clientX - rect.left : 16
    const dropY = rect ? e.clientY - rect.top : 16
 
    const rawX = Math.max(0, Math.round(dropX - 150))
    const rawY = Math.max(0, Math.round(dropY - 80))
    // Save to viewport-specific keys in tablet/mobile so the widget appears
    // at the drop position without overwriting the desktop layout.
    const posProps = { x: rawX, y: rawY }
    if (responsiveMode !== 'desktop') {
      const vKeys = rectKeysFor(responsiveMode)
      posProps[vKeys.x] = rawX
      posProps[vKeys.y] = rawY
    }
    onAddBlockToSection(section.id, type, 0, posProps)
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
              key={`${section.id}-${responsiveMode}`}
              ref={canvasRef}
              className={`section-free-canvas${isDragOver ? ' section-free-canvas--over' : ''}${showGrid ? ' section-free-canvas--grid' : ''}${isPreviewMode ? ' section-free-canvas--preview' : ''}`}
              style={{
                minHeight: sectionHeight,
                height: sectionHeight,
                ...(showGrid ? {
                  '--grid-size': `${gridSize}px`,
                } : {}),
              }}
              onClick={(e) => { if (!isPreviewMode && e.target === e.currentTarget) onSelect?.(null) }}
            >
                {blocks.map((block) => (
                  (() => {
                  const blockData = shouldUseDateFilteredData(block.type) ? data : (sourceData || data)
                  const displayRect = responsiveLayout?.rects?.[block.id]
                  const viewBlock = viewBlockFor(block, responsiveMode)
                  const viewportUpdater = makeViewportUpdater(onUpdateBlock, responsiveMode)
                  const otherRects = blocks
                    .filter((b) => b.id !== block.id)
                    .map((b) => {
                      const bd = defaultSize(b.type)
                      const otherDisplayRect = responsiveLayout?.rects?.[b.id]
                      const ob = viewBlockFor(b, responsiveMode)
                      return {
                        x: Number(otherDisplayRect?.x ?? ob.props?.x ?? 16),
                        y: Number(otherDisplayRect?.y ?? ob.props?.y ?? 16),
                        w: Number(otherDisplayRect?.w ?? ob.props?.width ?? bd.w),
                        h: Number(otherDisplayRect?.h ?? ob.props?.height ?? bd.h),
                      }
                    })
                  return (
                  <BlockItem
                  key={`${block.id}-${responsiveMode}`}
                  block={viewBlock}
                  data={blockData}
                  selected={selectedId === block.id}
                  onSelect={onSelect}
                  onRemove={() => onRemoveBlock(block.id)}
                  onDuplicate={() => onDuplicateBlock(block.id, section.id)}
                  onUpdateBlock={viewportUpdater}
                  canvasRef={canvasRef}
                  canvasWidth={canvasWidth}
                  otherRects={otherRects}
                  snapValue={snapValue}
                  zoom={zoom}
                  isPreviewMode={isPreviewMode}
                  displayRect={displayRect}
                  filteredOut={!widgetFilters[getFilterKey(block.type)]}
                  responsiveMode={responsiveMode}
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
 