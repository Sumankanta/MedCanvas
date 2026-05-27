import { useState, useCallback, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import CanvasArea from './components/canvas/CanvasArea'
import RightPanel from './components/layout/RightPanel'
import { useDashboardData } from './hooks/useDashboardData'

// ── Counters ────────────────────────────────────────────────────────────────
let blockCounter = 0
let sectionCounter = 0
const STORAGE_KEY = 'medical_dashboard_layout_v8'

function getResponsiveMode() {
  if (typeof window === 'undefined') return 'desktop'
  if (window.innerWidth <= 640) return 'mobile'
  if (window.innerWidth <= 1024) return 'tablet'
  return 'desktop'
}

function nextBlockId() { blockCounter += 1; return `block-${blockCounter}` }
function nextSectionId() { sectionCounter += 1; return `section-${sectionCounter}` }
function resetSectionCounter() { sectionCounter = 0 }

function syncCountersFromSections(sections) {
  const sectionNums = sections
    .map((s) => Number(String(s.id || '').split('-')[1]))
    .filter((n) => Number.isFinite(n))
  const blockNums = sections
    .flatMap((s) => (s.blocks || []))
    .map((b) => Number(String(b.id || '').split('-')[1]))
    .filter((n) => Number.isFinite(n))

  sectionCounter = sectionNums.length ? Math.max(...sectionNums) : 0
  blockCounter = blockNums.length ? Math.max(...blockNums) : 0
}

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
  chartScale: 100,
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
  text: 'Double-click to edit',
  imageAlt: 'Image placeholder',
  dividerLabel: '',
}

function makeBlock(type) {
  const size = defaultBlockSize(type)
  return {
    id: nextBlockId(),
    type,
    props: {
      ...DEFAULT_BLOCK_PROPS,
      width: size.width,
      height: size.height,
    },
  }
}

function defaultBlockSize(type) {
  if (type === 'kpi-card') return { width: 288, height: 160 }
  if (type?.startsWith('stat-')) return { width: 288, height: 160 }
  if (type === 'table') return { width: 360, height: 300 }
  if (type === 'advanced-table') return { width: 380, height: 320 }
  if (type === 'pivot-table') return { width: 380, height: 320 }
  if (type === 'layout-text') return { width: 360, height: 140 }
  if (type === 'layout-image') return { width: 360, height: 220 }
  if (type === 'layout-divider') return { width: 360, height: 72 }
  if (type === 'layout-spacer') return { width: 360, height: 120 }
  if (type === 'layout-row') return { width: 360, height: 180 }
  if (type === 'layout-column') return { width: 360, height: 180 }
  return { width: 360, height: 300 }
}

function overlaps(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

function findFreeSpot(existingBlocks, type) {
  const canvasWidth = 1120
  const padding = 16
  const gap = 12
  const scanStep = 12
  const size = defaultBlockSize(type)
  const w = Math.max(180, size.width)
  const h = Math.max(120, size.height)

  const occupied = existingBlocks.map((b) => {
    const s = defaultBlockSize(b.type)
    return {
      x: Number(b.props?.x ?? padding),
      y: Number(b.props?.y ?? padding),
      width: Number(b.props?.width ?? s.width),
      height: Number(b.props?.height ?? s.height),
    }
  })

  const maxY = Math.max(
    240,
    ...occupied.map((o) => o.y + o.height + gap),
  )

  for (let y = padding; y <= maxY + 1600; y += scanStep) {
    for (let x = padding; x <= Math.max(padding, canvasWidth - w - padding); x += scanStep) {
      const candidate = { x, y, width: w, height: h }
      const hit = occupied.some((o) => overlaps(candidate, o))
      if (!hit) return { x, y }
    }
  }

  return { x: padding, y: maxY + gap }
}

function makeSection(title = '', blockType = null) {
  const firstBlock = blockType ? makeBlock(blockType) : null
  return {
    id: nextSectionId(),
    title: title || `Section ${sectionCounter}`,
    cols: 2,
    blocks: firstBlock ? [firstBlock] : [],
    colSpanMap: firstBlock ? { [firstBlock.id]: { col: 0, colSpan: 1 } } : {},
  }
}

function getDefaultDashboardState() {
  const defaultSections = []
  syncCountersFromSections(defaultSections)
  return {
    sections: defaultSections,
    history: [JSON.parse(JSON.stringify(defaultSections))],
    index: 0,
    title: 'Medical Drive Monitoring Dashboard',
    subtitle: 'Real-time overview of screening drives and outcomes'
  }
}

function loadDashboardState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultDashboardState()
    const parsed = JSON.parse(raw)
    const sections = Array.isArray(parsed?.sections) ? parsed.sections : []
    syncCountersFromSections(sections)
    return {
      sections,
      history: [JSON.parse(JSON.stringify(sections))],
      index: 0,
      title: parsed.title || 'Medical Drive Monitoring Dashboard',
      subtitle: parsed.subtitle || 'Real-time overview of screening drives and outcomes'
    }
  } catch {
    return getDefaultDashboardState()
  }
}

function createTemplateSections(templateId) {
  resetSectionCounter()
  blockCounter = 0

  const chart = (type, x, y, width, height, title) => ({
    id: nextBlockId(),
    type,
    props: {
      ...DEFAULT_BLOCK_PROPS,
      title,
      x,
      y,
      width,
      height,
    },
  })

  if (templateId === 'kpi') {
    const s1 = { id: nextSectionId(), title: 'KPI Overview', cols: 12, blocks: [], colSpanMap: {} }
    s1.blocks = [
      chart('stat-total', 16, 16, 280, 170, 'Total Patients'),
      chart('stat-positive', 312, 16, 280, 170, 'Positive Cases'),
      chart('stat-normal', 608, 16, 280, 170, 'Normal / Clear'),
      chart('stat-tests', 904, 16, 280, 170, 'Tests Conducted'),
      chart('chart-line', 16, 206, 580, 360, 'Screening Trend'),
      chart('chart-bar', 612, 206, 572, 360, 'Daily Screenings'),
    ]
    return [s1]
  }

  if (templateId === 'compare') {
    const s1 = { id: nextSectionId(), title: 'Comparison Layout', cols: 12, blocks: [], colSpanMap: {} }
    s1.blocks = [
      chart('chart-bar', 16, 16, 370, 350, 'Camp A'),
      chart('chart-bar', 402, 16, 370, 350, 'Camp B'),
      chart('chart-bar', 788, 16, 370, 350, 'Camp C'),
      chart('chart-line', 16, 382, 564, 330, 'Weekly Trend'),
      chart('chart-area', 596, 382, 562, 330, 'Outcome Trend'),
    ]
    return [s1]
  }

  const s1 = { id: nextSectionId(), title: 'Medical Drive Monitoring Dashboard', cols: 12, blocks: [], colSpanMap: {} }
  s1.blocks = [
    chart('stat-total', 12, 12, 124, 96, 'Total Patients Screened'),
    chart('stat-tests', 144, 12, 124, 96, 'Tests Conducted'),
    chart('stat-positive', 276, 12, 124, 96, 'Positive Cases'),
    chart('stat-locations', 408, 12, 124, 96, 'Referred'),
    chart('chart-line', 12, 120, 256, 220, 'Patients Screened Over Time'),
    chart('chart-donut', 276, 120, 256, 220, 'Screening Outcome Distribution'),
    chart('table', 12, 352, 256, 230, 'Recent Screening Drives'),
    chart('chart-hbar', 276, 352, 256, 230, 'Tests Conducted by Type'),
  ]
  return [s1]
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

  const [dashboardState, setDashboardState] = useState(loadDashboardState)
  const [selectedId, setSelectedId] = useState(null)
  const [cols, setCols] = useState(2)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [browserMode, setBrowserMode] = useState(getResponsiveMode)
  const [previewMode, setPreviewMode] = useState(null)
  const rootRef = useRef(null)

  const { sections, history, index, title, subtitle } = dashboardState
  const responsiveMode = previewMode || browserMode

  useEffect(() => {
    const handleResize = () => {
      const nextMode = getResponsiveMode()
      setBrowserMode(nextMode)
      if (nextMode !== 'desktop') {
        setLeftOpen(false)
        setRightOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleResponsiveModeChange = useCallback((mode) => {
    setPreviewMode(mode)
    setZoom(100)
    if (mode === 'mobile') {
      setLeftOpen(false)
      setRightOpen(false)
    }
  }, [])

  const setDashboardTitle = useCallback((newTitle) => {
    setDashboardState(prev => ({ ...prev, title: newTitle }))
  }, [])

  const setDashboardSubtitle = useCallback((newSubtitle) => {
    setDashboardState(prev => ({ ...prev, subtitle: newSubtitle }))
  }, [])

  const saveDraft = useCallback(() => {
    try {
      const { sections: currentSections, title: currentTitle, subtitle: currentSubtitle } = dashboardState
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sections: currentSections,
        title: currentTitle,
        subtitle: currentSubtitle,
      }))
    } catch {
      // ignore storage failures
    }
  }, [dashboardState])

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

  const updateSection = useCallback((sectionId, patch, options = {}) => {
    const skipHistory = Boolean(options?.skipHistory)
    setDashboardState((prev) => {
      const nextSections = prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s,
      )

      if (skipHistory) {
        return {
          ...prev,
          sections: nextSections,
        }
      }

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
    void _colIndex
    setDashboardState((prev) => {
      const newBlock = makeBlock(type)
      const nextSections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s
        const colSpanMap = s.colSpanMap || {}
        const blocks = s.blocks || []
        const autoPos = initialPos && typeof initialPos === 'object'
          ? {
            x: Number(initialPos.x ?? 16),
            y: Number(initialPos.y ?? 16),
          }
          : findFreeSpot(blocks, type)

        newBlock.props = {
          ...newBlock.props,
          x: autoPos.x,
          y: autoPos.y,
        }

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
        const idx = blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return s
        const original = blocks[idx]
        const newId = nextBlockId()
        const clone = {
          ...original,
          id: newId,
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
  const updateBlockProps = useCallback((blockId, patch, options = {}) => {
    const skipHistory = Boolean(options?.skipHistory)
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

      if (skipHistory) {
        return {
          ...prev,
          sections: nextSections,
        }
      }

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
    blockCounter = 0
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage failures
    }
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

  const applyTemplate = useCallback((templateId = 'starter') => {
    const key = String(templateId).trim().toLowerCase()
    const normalized = key === 'kpi' || key === 'compare' ? key : 'starter'
    const templateSections = createTemplateSections(normalized)
    pushState(templateSections)
    setSelectedId(templateSections[0]?.blocks?.[0]?.id || null)
  }, [pushState])

  const exportDashboard = useCallback(async (format = 'pdf') => {
    if (isExporting) return
    const target = rootRef.current?.querySelector('.canvas-dropzone')
    if (!target) return

    try {
      setIsExporting(true)
      document.body.classList.add('is-exporting')
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      const width = Math.ceil(target.scrollWidth || target.clientWidth || 1280)
      const height = Math.ceil(target.scrollHeight || target.clientHeight || 720)

      const canvas = await html2canvas(target, {
        backgroundColor: '#020817',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
      })

      const fileStamp = new Date().toISOString().replace(/[:.]/g, '-')

      if (format === 'jpg') {
        const jpg = canvas.toDataURL('image/jpeg', 0.95)
        const a = document.createElement('a')
        a.href = jpg
        a.download = `medical-dashboard-${fileStamp}.jpg`
        document.body.appendChild(a)
        a.click()
        a.remove()
        return
      }

      const imgW = canvas.width
      const imgH = canvas.height
      const orientation = imgW >= imgH ? 'landscape' : 'portrait'
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [imgW, imgH],
      })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      pdf.save(`medical-dashboard-${fileStamp}.pdf`)
    } finally {
      document.body.classList.remove('is-exporting')
      setIsExporting(false)
    }
  }, [isExporting])

  // ── Keyboard ───────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
    if (e.key === 'Delete' && selectedId) { removeBlock(selectedId) }
    if (e.key === 'Escape') { setSelectedId(null) }
  }, [undo, redo, selectedId, removeBlock])

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedBlock = selectedId ? findBlock(sections, selectedId) : null
  const selectedSection = selectedId ? findSectionForBlock(sections, selectedId) : null
  const selectedSectionCols = selectedSection?.cols ?? cols
  const totalBlocks = allBlocks(sections).length

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
      ref={rootRef}
      className={`builder-root viewport-${responsiveMode} ${isPreviewMode ? 'is-preview' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <TopBar
        dashboardTitle={title}
        onUpdateDashboardTitle={setDashboardTitle}
        isPreviewMode={isPreviewMode}
        onSetPreviewMode={setIsPreviewMode}
        campInfo={data.campInfo}
        blockCount={totalBlocks}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
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
        onApplyTemplate={applyTemplate}
        onSaveDraft={saveDraft}
        onExport={exportDashboard}
        isExporting={isExporting}
      />

      <div className={`workspace${(leftOpen && !isPreviewMode) ? '' : ' left-hidden'}${(rightOpen && !isPreviewMode) ? '' : ' right-hidden'}`}>
        <RightPanel
          side="left"
          open={leftOpen && !isPreviewMode}
          variables={data.statVariables}
          onAddBlock={(type) => {
            if (sections.length === 0) {
              addSection(type)
            } else {
              addBlockToSection(sections[sections.length - 1].id, type)
            }
          }}
          onClose={() => setLeftOpen(false)}
        />

        <CanvasArea
          sections={sections}
          setSections={(s) => pushState(s)}
          data={data}
          isPreviewMode={isPreviewMode}
          selectedId={selectedId}
          dashboardTitle={title}
          dashboardSubtitle={subtitle}
          onUpdateDashboardTitle={setDashboardTitle}
          onUpdateDashboardSubtitle={setDashboardSubtitle}
          isPreviewMode={isPreviewMode}
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
          onZoom={setZoom}
          onUndo={undo}
          onRedo={redo}
          canUndo={index > 0}
          canRedo={index < history.length - 1}
          responsiveMode={responsiveMode}
          onResponsiveModeChange={handleResponsiveModeChange}
        />

        <LeftPanel
          side="right"
          open={rightOpen && !isPreviewMode}
          selectedBlock={selectedBlock}
          cols={selectedSectionCols}
          onUpdateBlock={(patch) => selectedId && updateBlockProps(selectedId, patch)}
          onRemoveBlock={() => selectedId && removeBlock(selectedId)}
          onUpdateSection={(patch) => selectedSection && updateSection(selectedSection.id, patch)}
          selectedSection={selectedSection}
          onClose={() => setRightOpen(false)}
        />
      </div>
    </div>
  )
}
