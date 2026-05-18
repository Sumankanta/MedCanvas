import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Grid2X2, Plus, SlidersHorizontal, Table2 } from 'lucide-react'
import CanvasSection from './CanvasSection'

// ── Sortable wrapper for a section ─────────────────────────────────────────
function SortableSection({ section, children }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex:  isDragging ? 999  : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDraggingSection: isDragging,
      })}
    </div>
  )
}

export default function CanvasArea({
  sections,
  data,
  selectedId, onUpdateBlock, onSelect, onRemoveBlock, onDuplicateBlock,
  onAddSection, onRemoveSection, onUpdateSection, onReorderSections,
  onAddBlockToSection, onReorderBlocksInSection,
  moveBlockBetweenSections,
  zoom,
}) {
  const [isDragOver,      setIsDragOver]      = useState(false)
  const [activeId,        setActiveId]        = useState(null) // Can be sectionId or blockId
  const [activeType,      setActiveType]      = useState(null) // 'section' or 'block'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
    setActiveType(active.data.current?.type || (String(active.id).startsWith('section-') ? 'section' : 'block'))
  }

  function handleDragOver({ active, over }) {
    if (!over || activeType !== 'block') return

    const activeId = active.id
    const overId = over.id

    // Find source and target sections
    const activeSection = sections.find(s => s.blocks.some(b => b.id === activeId))
    const overSection = sections.find(s => s.id === overId || s.blocks.some(b => b.id === overId))

    if (!activeSection || !overSection || activeSection.id === overSection.id) return

    // Move block between sections during drag for live feedback
    moveBlockBetweenSections(activeId, activeSection.id, overSection.id, overId)
  }

  function handleDragEnd({ active, over }) {
    const type = activeType
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    if (type === 'section') {
      if (active.id !== over.id) {
        const oi = sections.findIndex((s) => s.id === active.id)
        const ni = sections.findIndex((s) => s.id === over.id)
        if (oi !== -1 && ni !== -1) {
          onReorderSections(arrayMove(sections, oi, ni))
        }
      }
    } else if (type === 'block') {
      const activeId = active.id
      const overId = over.id

      const activeSection = sections.find(s => s.blocks.some(b => b.id === activeId))
      const overSection = sections.find(s => s.id === overId || s.blocks.some(b => b.id === overId))

      if (!activeSection || !overSection) return

      if (activeSection.id === overSection.id) {
        // Reorder within same section
        const blocks = activeSection.blocks
        const oi = blocks.findIndex(b => b.id === activeId)
        const ni = blocks.findIndex(b => b.id === overId)
        if (oi !== -1 && ni !== -1 && oi !== ni) {
          onReorderBlocksInSection(activeSection.id, arrayMove(blocks, oi, ni))
        }
      } else {
        // Already handled by handleDragOver, but ensure final state is pushed if needed
        // (Our moveBlockBetweenSections already pushes state)
      }
    }
  }

  // Canvas-level drop (adds a new section + block)
  function handleCanvasDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('blockType')
    if (type) onAddSection(type)   // creates a section + puts the block inside
  }

  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left">
          <button className="tb-btn" title="Grid"><Grid2X2 size={14} /></button>
          <span className="canvas-info">Grid</span>
          <button className="switch is-on" title="Toggle grid" />
          <span className="canvas-info">Snap to grid</span>
          <button className="switch is-on" title="Snap to grid" />
        </div>
        <div className="canvas-toolbar-right">
          <button className="date-filter"><Calendar size={14} /> This Month (May 1 - May 31, 2025)</button>
          <button className="date-filter"><SlidersHorizontal size={14} /> Filters</button>
        </div>
      </div>

      {/* ── Viewport ── */}
      <div
        className="canvas-viewport"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={handleCanvasDrop}
        onClick={(e) => { if (e.target === e.currentTarget) onSelect(null) }}
      >
        <div className="canvas-surface" style={{ transform: `scale(${zoom / 100})` }}>
          <div className={`canvas-dropzone${isDragOver ? ' drag-over' : ''}`}>

            {/* ── Empty State ── */}
            {sections.length === 0 && (
              <div className="canvas-empty">
                <div className="canvas-empty-ring"><Grid2X2 size={28} /></div>
                <p className="canvas-empty-title">
                  {isDragOver ? 'Drop to create a section' : 'Canvas is empty'}
                </p>
                <p className="canvas-empty-sub">
                  Drag widgets from the left panel or click a card to add
                </p>
                <button
                  className="canvas-empty-cta"
                  onClick={() => onAddSection(null)}
                >
                  <Plus size={14} /> Add First Section
                </button>
              </div>
            )}

            {/* ── Sections ── */}
            {sections.length > 0 && (
              <>
                {isDragOver && (
                  <div className="drop-hint-banner">
                    <Plus size={13} /> Drop widget here or click to add
                  </div>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => { setActiveId(null); setActiveType(null); }}
                >
                  <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="sections-list">
                      {sections.map((section) => (
                        <SortableSection key={section.id} section={section}>
                          {({ dragHandleProps, isDraggingSection }) => (
                            <CanvasSection
                              section={section}
                              data={data}
                              selectedId={selectedId}
                              onSelect={onSelect}
                              onUpdateBlock={onUpdateBlock}
                              onRemoveBlock={onRemoveBlock}
                              onDuplicateBlock={onDuplicateBlock}
                              onUpdateSection={onUpdateSection}
                              onRemoveSection={onRemoveSection}
                              onReorderBlocksInSection={onReorderBlocksInSection}
                              onAddBlockToSection={onAddBlockToSection}
                              dragHandleProps={dragHandleProps}
                              isDraggingSection={isDraggingSection}
                              activeId={activeId}
                              activeType={activeType}
                            />
                          )}
                        </SortableSection>
                      ))}
                    </div>
                  </SortableContext>

                  {/* Ghost for drag */}
                  <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
                    {activeId && activeType === 'section' && (() => {
                      const activeSection = sections.find(s => s.id === activeId)
                      return activeSection ? (
                        <div className="section-drag-ghost">
                          <Table2 size={16} />
                          Moving section: <strong>{activeSection.title || 'Section'}</strong>
                          <span className="section-drag-ghost-count">
                            {activeSection.blocks?.length || 0} widgets
                          </span>
                        </div>
                      ) : null
                    })()}
                    {activeId && activeType === 'block' && (() => {
                      const activeBlock = sections.flatMap(s => s.blocks).find(b => b.id === activeId)
                      return activeBlock ? (
                        <div style={{
                          opacity: 0.88, pointerEvents: 'none', borderRadius: 13, overflow: 'hidden',
                          height: Number(activeBlock.props?.height) || 380,
                          width: 260, boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
                        }}>
                          <CanvasBlock
                            block={activeBlock} data={data} selected={false}
                            onRemove={() => {}} onDuplicate={() => {}} onSelect={() => {}}
                          />
                        </div>
                      ) : null
                    })()}
                  </DragOverlay>
                </DndContext>

                {/* Add section footer */}
                <button
                  className="canvas-add-section-footer"
                  onClick={() => onAddSection(null)}
                >
                  <Plus size={13} /> Drop widget here or click to add
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
