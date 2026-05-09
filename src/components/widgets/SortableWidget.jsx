import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function SortableWidget({
  id,
  children,
  selected,
  onClick,
  colSpan    = 1,
  height: controlledHeight = 420,
  minHeight  = 160,
  maxHeight  = 900,
  onHeightCommit,
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging, isOver,
  } = useSortable({ id })

  const [height, setHeight]       = useState(controlledHeight)
  const [isResizing, setIsResizing] = useState(false)
  const startY  = useRef(0)
  const startH  = useRef(controlledHeight)
  const liveH   = useRef(controlledHeight)

  // Sync from left-panel slider when not dragging resize handle
  useEffect(() => {
    if (!isResizing) {
      setHeight(controlledHeight)
      liveH.current = controlledHeight
    }
  }, [controlledHeight, isResizing])

  function onResizeDown(e) {
    e.preventDefault()
    e.stopPropagation()
    startY.current = e.clientY
    startH.current = height
    setIsResizing(true)

    function move(ev) {
      const newH = Math.max(minHeight, Math.min(maxHeight, startH.current + ev.clientY - startY.current))
      setHeight(newH)
      liveH.current = newH
    }
    function up() {
      setIsResizing(false)
      if (onHeightCommit) onHeightCommit(Math.round(liveH.current))
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // CSS grid "span N" only accepts integers.
  // CanvasArea sets gridTemplateColumns to cols*2 tracks.
  // So colSpan 1 → span 2, colSpan 1.5 → span 3, colSpan 2 → span 4, etc.
  const trackSpan = Math.round(colSpan * 2)

  return (
    <div
      ref={setNodeRef}
      className={`sortable-widget${selected ? ' selected' : ''}`}
      style={{
        gridColumn: `span ${trackSpan}`,
        transform:  CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : (transition || 'transform 200ms cubic-bezier(0.16,1,0.3,1)'),
        opacity:    isDragging ? 0.3 : 1,
        zIndex:     isDragging ? 999 : 'auto',
        outline:    isOver && !isDragging ? '2px dashed rgba(6,182,212,0.4)' : 'none',
        outlineOffset: 4,
      }}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle-bar"
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="drag-dots"><GripVertical size={14} /></span>
      </div>

      {/* Resize container */}
      <div
        style={{
          position:   'relative',
          height:     `${height}px`,
          overflow:   'hidden',
          transition: isResizing ? 'none' : 'height 0.12s ease',
          borderRadius: 15,
        }}
      >
        {children}

        <div className="resize-handle" onMouseDown={onResizeDown} title="Resize height">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M10 1L1 10"     stroke="rgba(6,182,212,0.8)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 5.5L5.5 10" stroke="rgba(6,182,212,0.8)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}