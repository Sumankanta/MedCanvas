import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortableWidget from '../widgets/SortableWidget'
import CanvasBlock from './CanvasBlock'

let dropCounter = 1000

export default function PreviewCanvas({ blocks, setBlocks, data, onRemove, cols = 2 }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeId,   setActiveId]   = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart({ active }) { setActiveId(active.id) }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (active.id !== over?.id) {
      setBlocks(prev => {
        const oi = prev.findIndex(b => b.id === active.id)
        const ni = prev.findIndex(b => b.id === over.id)
        return arrayMove(prev, oi, ni)
      })
    }
  }

  function handleDragCancel() { setActiveId(null) }

  function handleCanvasDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('blockType')
    if (type) {
      dropCounter++
      setBlocks(prev => [...prev, { id: `drop-${dropCounter}`, type }])
    }
  }

  const activeBlock = blocks.find(b => b.id === activeId)

  const ICONS = {
    'chart-bar':'📊','chart-stacked':'📶','chart-line':'📈','chart-area':'🏔',
    'chart-pie':'🥧','chart-donut':'🍩','chart-radialbar':'🎯',
    'chart-scatter':'✦','num':'🔢','table':'📋',
  }

  return (
    <div
      className="preview-canvas"
      onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
      onDrop={handleCanvasDrop}
    >
      {/* Top bar */}
      <div className="canvas-topbar">
        <span className="canvas-topbar-label">
          📋 Live Preview — {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          {cols > 1 && (
            <span style={{ marginLeft: 8, color: 'var(--text-faint)', fontSize: 10 }}>
              · {cols}-column layout
            </span>
          )}
        </span>
        {blocks.length > 0 && (
          <span className="canvas-topbar-hint">⠿ drag to reorder · hover to edit / remove</span>
        )}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="canvas-empty">
          <div className={`canvas-empty-inner${isDragOver ? ' drag-over' : ''}`}>
            <div className="canvas-empty-icon">📋</div>
            <p className={`canvas-empty-title${isDragOver ? ' drag-over' : ''}`}>
              {isDragOver ? '↓ Drop block here' : 'Canvas is empty'}
            </p>
            <p className="canvas-empty-sub">Drag or click any block from the right panel</p>
          </div>
        </div>
      )}

      {/* Block grid */}
      {blocks.length > 0 && (
        <div className="canvas-grid-wrapper">
          {isDragOver && <div className="drop-hint-banner">↓ Drop to add new block</div>}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
              {/*
                KEY FIX: align-items: start
                Without this, CSS grid stretches every cell in a row to match
                the tallest cell — causing blank space below shorter cards.
                align-items: start makes each cell only as tall as its content.
              */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: 14,
                alignItems: 'start',
              }}>
                {blocks.map(block => (
                  <SortableWidget key={block.id} id={block.id}>
                    <CanvasBlock
                      block={block}
                      data={data}
                      onRemove={() => onRemove(block.id)}
                    />
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>

            {/* Drag ghost */}
            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
              {activeBlock && (
                <div className="drag-ghost">
                  <span style={{ fontSize: 20 }}>{ICONS[activeBlock.type] || '📊'}</span>
                  Moving widget...
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}