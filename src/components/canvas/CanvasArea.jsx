import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Grid3X3, Grid2X2, Plus, SlidersHorizontal, Table2, Monitor, Smartphone, Tablet, Undo, Redo, Minus, ZoomIn, Magnet, PenLine, ChevronDown, Lock } from 'lucide-react'
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
  isPreviewMode = false,
  dashboardTitle, dashboardSubtitle,
  onUpdateDashboardTitle, onUpdateDashboardSubtitle,
  selectedId, onUpdateBlock, onSelect, onRemoveBlock, onDuplicateBlock,
  onAddSection, onRemoveSection, onUpdateSection, onReorderSections,
  onAddBlockToSection, onReorderBlocksInSection,
  moveBlockBetweenSections,
  zoom, onZoom, onUndo, onRedo, canUndo, canRedo,
  responsiveMode = 'desktop', onResponsiveModeChange,
}) {
  const [isDragOver,      setIsDragOver]      = useState(false)
  const [activeId,        setActiveId]        = useState(null) // Can be sectionId or blockId
  const [activeType,      setActiveType]      = useState(null) // 'section' or 'block'
  const [editingTitle,    setEditingTitle]    = useState(false)
  const [editingSubtitle, setEditingSubtitle] = useState(false)
  const [showGrid,        setShowGrid]        = useState(true)
  const [snapToGrid,      setSnapToGrid]      = useState(true)
  const GRID_SIZE = 24 // px
  const effectiveShowGrid = isPreviewMode ? false : showGrid
  const effectiveSnapToGrid = isPreviewMode ? false : snapToGrid
  const viewportWidths = {
    desktop: 1280,
    tablet: 920,
    mobile: 390,
  }
  const viewportWidth = viewportWidths[responsiveMode] || viewportWidths.desktop
  const viewportLabels = {
    desktop: 'Desktop preview, 1120 pixels',
    tablet: 'Tablet preview, 768 pixels',
    mobile: 'Mobile preview, 390 pixels',
  }

  const snapValue = useCallback((val) => {
    if (!snapToGrid) return val
    return Math.round(val / GRID_SIZE) * GRID_SIZE
  }, [snapToGrid])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart({ active }) {
    if (isPreviewMode) return
    setActiveId(active.id)
    setActiveType(active.data.current?.type || (String(active.id).startsWith('section-') ? 'section' : 'block'))
  }

  function handleDragOver({ active, over }) {
    if (isPreviewMode) return
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
    if (isPreviewMode) {
      setActiveId(null)
      setActiveType(null)
      return
    }
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
    if (isPreviewMode) return
    e.preventDefault()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('blockType')
    if (type) onAddSection(type)   // creates a section + puts the block inside
  }

  return (
    <main className={`canvas-area canvas-area--${responsiveMode}`}>
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="toolbar-group">
            <button className="tb-btn" onClick={onUndo} disabled={!canUndo || isPreviewMode} title="Undo" style={{ opacity: canUndo && !isPreviewMode ? 1 : 0.35 }}>
              <Undo size={14} />
            </button>
            <button className="tb-btn" onClick={onRedo} disabled={!canRedo || isPreviewMode} title="Redo" style={{ opacity: canRedo && !isPreviewMode ? 1 : 0.35 }}>
              <Redo size={14} />
            </button>
          </div>
          <div className="toolbar-separator" style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />
          <div className="toolbar-group responsive-switcher">
            <button
              className={`tb-btn${responsiveMode === 'desktop' ? ' active' : ''}`}
              onClick={() => onResponsiveModeChange?.('desktop')}
              title={viewportLabels.desktop}
              aria-label={viewportLabels.desktop}
              aria-pressed={responsiveMode === 'desktop'}
            >
              <Monitor size={14} />
            </button>
            <button
              className={`tb-btn${responsiveMode === 'tablet' ? ' active' : ''}`}
              onClick={() => onResponsiveModeChange?.('tablet')}
              title={viewportLabels.tablet}
              aria-label={viewportLabels.tablet}
              aria-pressed={responsiveMode === 'tablet'}
            >
              <Tablet size={14} />
            </button>
            <button
              className={`tb-btn${responsiveMode === 'mobile' ? ' active' : ''}`}
              onClick={() => onResponsiveModeChange?.('mobile')}
              title={viewportLabels.mobile}
              aria-label={viewportLabels.mobile}
              aria-pressed={responsiveMode === 'mobile'}
            >
              <Smartphone size={14} />
            </button>
          </div>
          {isPreviewMode && (
            <div className="preview-lock-badge">
              <Lock size={12} />
              <span>Read-only preview</span>
            </div>
          )}
        </div>

        <div className="canvas-toolbar-center" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className={`grid-toggle-btn ${effectiveShowGrid ? 'active' : ''}`}
              onClick={() => !isPreviewMode && setShowGrid((v) => !v)}
              title={effectiveShowGrid ? 'Hide grid' : 'Show grid'}
              disabled={isPreviewMode}
            >
              <Grid3X3 size={13} />
              <span>Grid</span>
            </button>
            <button
              className={`grid-toggle-btn ${effectiveSnapToGrid ? 'active' : ''}`}
              onClick={() => !isPreviewMode && setSnapToGrid((v) => !v)}
              title={effectiveSnapToGrid ? 'Disable snap to grid' : 'Enable snap to grid'}
              disabled={isPreviewMode}
            >
              <Magnet size={13} />
              <span>Snap</span>
            </button>
          </div>

          <div className="toolbar-separator" style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />

          <div className="toolbar-group zoom-group">
            <button className="tb-btn" onClick={() => onZoom && onZoom((z) => Math.max(50, z - 10))} title="Zoom out">
              <Minus size={14} />
            </button>
            <span className="zoom-display">{zoom}%</span>
            <button className="tb-btn" onClick={() => onZoom && onZoom((z) => Math.min(150, z + 10))} title="Zoom in">
              <Plus size={14} />
            </button>
            <button className="fit-btn" onClick={() => onZoom && onZoom(100)}>Fit Width</button>
          </div>
        </div>

        <div className="canvas-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Empty right side, moved calendar/filters to dashboard header */}
        </div>
      </div>

      {/* ── Viewport ── */}
      <div
        className={`canvas-viewport canvas-viewport--${responsiveMode}${effectiveShowGrid ? ' canvas-viewport--grid' : ''}${isPreviewMode ? ' canvas-viewport--preview' : ''}`}
        onDragOver={isPreviewMode ? undefined : (e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={isPreviewMode ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={isPreviewMode ? undefined : handleCanvasDrop}
        onClick={isPreviewMode ? undefined : (e) => { if (e.target === e.currentTarget) onSelect(null) }}
      >
        <div
          className={`canvas-surface canvas-surface--${responsiveMode}`}
          style={{
            transform: `scale(${zoom / 100})`,
            width: `min(${viewportWidth}px, 100%)`,
          }}
          data-viewport={viewportLabels[responsiveMode]}
        >
          <div className="dashboard-header-block dashboard-header-block--responsive">
            <div className="dashboard-header-copy">
              {editingTitle ? (
                <input
                  autoFocus
                  className="dashboard-title-input"
                  value={dashboardTitle}
                  onChange={(e) => onUpdateDashboardTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                />
              ) : (
                <h1 onClick={() => setEditingTitle(true)} className="dashboard-title">
                  {dashboardTitle || 'Untitled Dashboard'} <PenLine size={14} style={{ color: '#98a2b3' }} />
                </h1>
              )}

              {editingSubtitle ? (
                <input
                  autoFocus
                  className="dashboard-subtitle-input"
                  value={dashboardSubtitle}
                  onChange={(e) => onUpdateDashboardSubtitle(e.target.value)}
                  onBlur={() => setEditingSubtitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingSubtitle(false)}
                />
              ) : (
                <p onClick={() => setEditingSubtitle(true)} className="dashboard-subtitle">
                  {dashboardSubtitle || 'Add a subtitle'} <PenLine size={12} style={{ color: '#98a2b3' }} />
                </p>
              )}
            </div>
            <div className="dashboard-header-actions">
              {responsiveMode !== 'mobile' && (
                <button className="date-filter dashboard-date-filter dashboard-date-filter--range"><Calendar size={14} color="#667085" /> This Month (May 1 - May 31, 2025) <ChevronDown size={14} color="#667085" /></button>
              )}
              <button className="date-filter dashboard-date-filter dashboard-date-filter--filters"><SlidersHorizontal size={14} color="#667085" /> Filters</button>
            </div>
          </div>

          <div className={`canvas-dropzone${isDragOver ? ' drag-over' : ''}${isPreviewMode ? ' canvas-dropzone--preview' : ''}`}>

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
                {!isPreviewMode && isDragOver && (
                  <div className="drop-hint-banner">
                    <Plus size={13} /> Drop widget here or click to add
                  </div>
                )}

                {isPreviewMode ? (
                  <div className="sections-list sections-list--preview">
                    {sections.map((section) => (
                      <CanvasSection
                        key={section.id}
                        section={section}
                        data={data}
                        selectedId={null}
                        onSelect={undefined}
                        onUpdateBlock={onUpdateBlock}
                        onRemoveBlock={onRemoveBlock}
                        onDuplicateBlock={onDuplicateBlock}
                        onUpdateSection={onUpdateSection}
                        onRemoveSection={onRemoveSection}
                        onReorderBlocksInSection={onReorderBlocksInSection}
                        onAddBlockToSection={onAddBlockToSection}
                        snapToGrid={false}
                        showGrid={false}
                        gridSize={GRID_SIZE}
                        snapValue={snapValue}
                        isPreviewMode
                        responsiveMode={responsiveMode}
                      />
                    ))}
                  </div>
                ) : (
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
                                snapToGrid={snapToGrid}
                                showGrid={showGrid}
                                gridSize={GRID_SIZE}
                                snapValue={snapValue}
                                isPreviewMode={false}
                                responsiveMode={responsiveMode}
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
                )}

                {/* Add section footer */}
                {!isPreviewMode && (
                  <button
                    className="canvas-add-section-footer"
                    onClick={() => onAddSection(null)}
                  >
                    <Plus size={13} /> Drop widget here or click to add
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
