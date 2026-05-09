import { useState, useCallback } from 'react'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import CanvasArea from './components/canvas/CanvasArea'
import RightPanel from './components/layout/RightPanel'
import { useDashboardData } from './hooks/useDashboardData'

// ── Counters ────────────────────────────────────────────────────────────────
let blockCounter   = 0
let sectionCounter = 0

function nextBlockId()   { blockCounter   += 1; return `block-${blockCounter}`   }
function nextSectionId() { sectionCounter += 1; return `section-${sectionCounter}` }
function resetSectionCounter() { sectionCounter = 0 }

// ── Default props ────────────────────────────────────────────────────────────
const DEFAULT_BLOCK_PROPS = {
  title: '',
  subtitle: '',
  color: '',
  opacity: 100,
  radius: 15,
  colSpan: 1,
  height: 420,
  showLegend: true,
  showGrid: true,
  showDots: true,
  pieLabel: false,
  fontSize: 11,
  fontFamily: 'Plus Jakarta Sans',
  fontWeight: 'Regular (400)',
  xKey: '',
  yKey: '',
  yKey2: '',
  extraYKeys: [],
  strokeWidth: 2,
  barRadius: 4,
  innerRadius: 30,
  outerRadius: 55,
  barSize: 12,
  areaOpacity: 30,
  series2Color: '#ef4444',
}

function makeBlock(type) {
  return {
    id:    nextBlockId(),
    type,
    props: { ...DEFAULT_BLOCK_PROPS },
  }
}

function makeSection(title = '', blockType = null) {
  const firstBlock = blockType ? makeBlock(blockType) : null
  return {
    id:         nextSectionId(),
    title:      title || `Section ${sectionCounter}`,
    cols:       2,
    blocks:     firstBlock ? [firstBlock] : [],
    colSpanMap: firstBlock ? { [firstBlock.id]: { col: 0, colSpan: 1 } } : {},
  }
}

// ── Flat block lookup helpers ────────────────────────────────────────────────
function allBlocks(sections) {
  return sections.flatMap((s) => s.blocks || [])
}

function findBlock(sections, blockId) {
  for (const s of sections) {
    const b = (s.blocks || []).find((b) => b.id === blockId)
    if (b) return b
  }
  return null
}

function findSectionForBlock(sections, blockId) {
  return sections.find((s) => (s.blocks || []).some((b) => b.id === blockId)) || null
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { data, loading, lastUpdated, refetch, isRefreshing } = useDashboardData()

  const [dashboardState, setDashboardState] = useState({
    sections: [],
    history: [[]],
    index: 0
  })
  const [selectedId, setSelectedId] = useState(null)
  const [cols,       setCols]       = useState(2)
  const [leftOpen,   setLeftOpen]   = useState(true)
  const [rightOpen,  setRightOpen]  = useState(true)
  const [zoom,       setZoom]       = useState(100)

  const { sections, history, index } = dashboardState

  // ── History Helpers ────────────────────────────────────────────────────────
  const pushState = useCallback((newSections) => {
    setDashboardState((prev) => {
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(newSections))]
      return {
        ...prev,
        sections: newSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  const undo = useCallback(() => {
    setDashboardState((prev) => {
      if (prev.index <= 0) return prev
      const newIdx = prev.index - 1
      return {
        ...prev,
        sections: prev.history[newIdx],
        index: newIdx,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setDashboardState((prev) => {
      if (prev.index >= prev.history.length - 1) return prev
      const newIdx = prev.index + 1
      return {
        ...prev,
        sections: prev.history[newIdx],
        index: newIdx,
      }
    })
  }, [])

  // ── Section operations ─────────────────────────────────────────────────────
  const addSection = useCallback((blockType = null) => {
    const section = makeSection('', blockType)
    setDashboardState((prev) => {
      const nextSections = [...prev.sections, section]
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
    if (blockType && section.blocks[0]) {
      setSelectedId(section.blocks[0].id)
    }
  }, [])

  const removeSection = useCallback((sectionId) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.filter((s) => s.id !== sectionId)
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
    setSelectedId(null)
  }, [])

  const updateSection = useCallback((sectionId, patch) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s,
      )
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  const reorderSections = useCallback((reordered) => {
    pushState(reordered)
  }, [pushState])

  const setAllSectionCols = useCallback(() => {
    setCols(12)
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) => ({ ...s, cols: 12 }))
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  // ── Block operations ───────────────────────────────────────────────────────
  const addBlockToSection = useCallback((sectionId, type, _colIndex = 0, initialPos = null) => {
    setDashboardState((prev) => {
      const newBlock = makeBlock(type)
      if (initialPos && typeof initialPos === 'object') {
        newBlock.props = {
          ...newBlock.props,
          x: Number(initialPos.x ?? 16),
          y: Number(initialPos.y ?? 16),
        }
      }
      const nextSections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s
        const colSpanMap  = s.colSpanMap || {}
        const blocks      = s.blocks || []

        const newColSpanMap = { ...colSpanMap, [newBlock.id]: { col: 0, colSpan: 6 } }
        return { ...s, blocks: [...blocks, newBlock], colSpanMap: newColSpanMap }
      })
      
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      
      // Select the new block after state update
      setTimeout(() => setSelectedId(newBlock.id), 0)

      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  const removeBlock = useCallback((blockId) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) => ({
        ...s,
        blocks: (s.blocks || []).filter((b) => b.id !== blockId),
        colSpanMap: (() => {
          const m = { ...s.colSpanMap };
          delete m[blockId];
          return m;
        })()
      }))
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
    if (selectedId === blockId) setSelectedId(null)
  }, [selectedId])

  const duplicateBlock = useCallback((blockId, sectionId) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) => {
        if (sectionId && s.id !== sectionId) return s
        const blocks = s.blocks || []
        const idx    = blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return s
        const original = blocks[idx]
        const newId = nextBlockId()
        const clone = {
          ...original,
          id:    newId,
          props: { ...DEFAULT_BLOCK_PROPS, ...original.props },
        }
        const newColSpanMap = { ...s.colSpanMap }
        if (newColSpanMap[blockId]) {
          newColSpanMap[newId] = { ...newColSpanMap[blockId] }
        }
        return {
          ...s,
          blocks: [...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)],
          colSpanMap: newColSpanMap,
        }
      })
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  /**
   * Update props on a block.
   */
  const updateBlockProps = useCallback((blockId, patch) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) => {
        const blockIdx = s.blocks.findIndex(b => b.id === blockId);
        if (blockIdx === -1) return s;

        let newColSpanMap = { ...s.colSpanMap };
        if (patch.colSpan !== undefined) {
          newColSpanMap[blockId] = { 
            ...(newColSpanMap[blockId] || { col: 0 }), 
            colSpan: patch.colSpan 
          };
        }

        return {
          ...s,
          colSpanMap: newColSpanMap,
          blocks: s.blocks.map((b) =>
            b.id === blockId
              ? { ...b, props: { ...DEFAULT_BLOCK_PROPS, ...b.props, ...patch } }
              : b,
          ),
        };
      });

      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  const reorderBlocksInSection = useCallback((sectionId, reorderedBlocks) => {
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) =>
        s.id === sectionId ? { ...s, blocks: reorderedBlocks } : s,
      )
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
  }, [])

  const moveBlockToSection = useCallback((blockId, sourceSectionId, targetSectionId, newIndex) => {
    setDashboardState((prev) => {
      const sourceSection = prev.sections.find(s => s.id === sourceSectionId);
      const targetSection = prev.sections.find(s => s.id === targetSectionId);
      if (!sourceSection || !targetSection) return prev;

      const block = sourceSection.blocks.find(b => b.id === blockId);
      if (!block) return prev;

      // Remove from source
      const nextSourceBlocks = sourceSection.blocks.filter(b => b.id !== blockId);
      const nextSourceColSpanMap = { ...sourceSection.colSpanMap };
      delete nextSourceColSpanMap[blockId];

      // Add to target
      const nextTargetBlocks = [...targetSection.blocks];
      nextTargetBlocks.splice(newIndex, 0, block);
      
      // Default to column 0 if moving to a new section, or keep same col if target has it
      const nextTargetColSpanMap = { ...targetSection.colSpanMap };
      nextTargetColSpanMap[blockId] = sourceSection.colSpanMap[blockId] || { col: 0, colSpan: 6 };

      const nextSections = prev.sections.map(s => {
        if (s.id === sourceSectionId) return { ...s, blocks: nextSourceBlocks, colSpanMap: nextSourceColSpanMap };
        if (s.id === targetSectionId) return { ...s, blocks: nextTargetBlocks, colSpanMap: nextTargetColSpanMap };
        return s;
      });

      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    });
  }, []);

  const moveBlockBetweenSections = useCallback((blockId, fromSectionId, toSectionId, overBlockId) => {
    setDashboardState((prev) => {
      const fromSection = prev.sections.find(s => s.id === fromSectionId);
      const toSection = prev.sections.find(s => s.id === toSectionId);
      if (!fromSection || !toSection) return prev;

      const block = fromSection.blocks.find(b => b.id === blockId);
      if (!block) return prev;

      const nextSections = prev.sections.map(s => {
        if (s.id === fromSectionId) {
          return {
            ...s,
            blocks: s.blocks.filter(b => b.id !== blockId),
            colSpanMap: (() => {
              const m = { ...s.colSpanMap };
              delete m[blockId];
              return m;
            })()
          };
        }
        if (s.id === toSectionId) {
          const overIdx = s.blocks.findIndex(b => b.id === overBlockId);
          const newBlocks = [...s.blocks];
          if (overIdx === -1) newBlocks.push(block);
          else newBlocks.splice(overIdx, 0, block);

          return {
            ...s,
            blocks: newBlocks,
            colSpanMap: {
              ...s.colSpanMap,
              [blockId]: fromSection.colSpanMap[blockId] || { col: 0, colSpan: 6 }
            }
          };
        }
        return s;
      });

      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, JSON.parse(JSON.stringify(nextSections))]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    });
  }, []);

  // ── Clear ──────────────────────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    resetSectionCounter()
    setDashboardState((prev) => {
      const nextSections = []
      const truncated = prev.history.slice(0, prev.index + 1)
      const nextHistory = [...truncated, []]
      return {
        ...prev,
        sections: nextSections,
        history: nextHistory,
        index: nextHistory.length - 1,
      }
    })
    setSelectedId(null)
  }, [])

  // ── Keyboard ───────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
    if (e.key === 'Delete' && selectedId) { removeBlock(selectedId) }
    if (e.key === 'Escape') { setSelectedId(null) }
  }, [undo, redo, selectedId, removeBlock])

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedBlock       = selectedId ? findBlock(sections, selectedId) : null
  const selectedSection     = selectedId ? findSectionForBlock(sections, selectedId) : null
  const selectedSectionCols = selectedSection?.cols ?? cols
  const totalBlocks         = allBlocks(sections).length

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Loading Medical Drive Monitor...</p>
      </div>
    )
  }

  return (
    <div
      className="builder-root"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <TopBar
        campInfo={data.campInfo}
        blockCount={totalBlocks}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        canUndo={index > 0}
        canRedo={index < history.length - 1}
        zoom={zoom}
        onZoom={setZoom}
        cols={cols}
        onCols={setAllSectionCols}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => setLeftOpen((o) => !o)}
        onToggleRight={() => setRightOpen((o) => !o)}
      />

      <div className="workspace">
        <LeftPanel
          open={leftOpen}
          selectedBlock={selectedBlock}
          cols={selectedSectionCols}
          onUpdateBlock={(patch) => selectedId && updateBlockProps(selectedId, patch)}
          onUpdateSection={(patch) => selectedSection && updateSection(selectedSection.id, patch)}
          selectedSection={selectedSection}
          onClose={() => setLeftOpen(false)}
        />

        <CanvasArea
          sections={sections}
          setSections={(s) => pushState(s)}
          data={data}
          selectedId={selectedId}
          onUpdateBlock={updateBlockProps}
          onSelect={setSelectedId}
          onRemoveBlock={removeBlock}
          onDuplicateBlock={duplicateBlock}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onUpdateSection={updateSection}
          onReorderSections={reorderSections}
          onAddBlockToSection={addBlockToSection}
          onReorderBlocksInSection={reorderBlocksInSection}
          moveBlockBetweenSections={moveBlockBetweenSections}
          cols={cols}
          zoom={zoom}
        />

        <RightPanel
          open={rightOpen}
          variables={data.statVariables}
          onAddBlock={(type) => {
            if (sections.length === 0) {
              addSection(type)
            } else {
              addBlockToSection(sections[sections.length - 1].id, type)
            }
          }}
        />
      </div>
    </div>
  )
}
