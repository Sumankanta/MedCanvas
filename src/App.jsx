import { useState, useCallback, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import CanvasArea from './components/canvas/CanvasArea'
import RightPanel from './components/layout/RightPanel'
import { useDashboardData } from './hooks/useDashboardData'

// â”€â”€ Counters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let blockCounter = 0
let sectionCounter = 0
const STORAGE_KEY = 'medical_dashboard_layout_v9'
const SETTINGS_STORAGE_KEY = 'medical_dashboard_settings_v1'

const DEFAULT_SETTINGS = {
  themeMode: 'light',
  scheduleEnabled: false,
  scheduleMode: 'sunset',
  scheduleLightTime: '06:00',
  scheduleDarkTime: '22:00',
  accentColor: '#1570ef',
  fontScale: 100,
  highContrast: false,
  screenReader: false,
  dashboardLayout: 'comfortable',
  defaultLandingPage: 'builder',
  showCharts: true,
  showStats: true,
  showTables: true,
  gridDensity: 'normal',
  autoRefreshInterval: 0,
  notificationsEnabled: true,
  reportFormat: 'pdf',
  includePatientData: true,
  language: 'en',
  timeZone: 'Asia/Kolkata',
  dateTimeFormat: 'dd-mm-yyyy',
  profileName: 'SK',
  profileEmail: 'user@phc.local',
  twoFactorEnabled: false,
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return (hours * 60) + minutes
}

function getScheduledTheme(settings, date = new Date()) {
  const now = (date.getHours() * 60) + date.getMinutes()
  const lightStart = settings.scheduleMode === 'custom'
    ? timeToMinutes(settings.scheduleLightTime)
    : timeToMinutes('06:00')
  const darkStart = settings.scheduleMode === 'custom'
    ? timeToMinutes(settings.scheduleDarkTime)
    : timeToMinutes('18:00')

  if (lightStart === darkStart) return 'light'
  if (lightStart < darkStart) {
    return now >= lightStart && now < darkStart ? 'light' : 'dark'
  }
  return now >= lightStart || now < darkStart ? 'light' : 'dark'
}

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (parsed?.themeMode === 'auto') parsed.themeMode = 'scheduled'
    const merged = { ...DEFAULT_SETTINGS, ...parsed }
    if (merged.themeMode === 'scheduled' && parsed.scheduleEnabled === undefined) {
      merged.scheduleEnabled = true
    }
    return merged
  } catch {
    return DEFAULT_SETTINGS
  }
}

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

// â”€â”€ Default props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  headingFontSize: 11,
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
  imageSrc: '',
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
  if (type === 'kpi-card') return { width: 194, height: 120 }
  if (type?.startsWith('stat-')) return { width: 194, height: 120 }
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

function findDuplicateSpot(existingBlocks, originalBlock) {
  const canvasWidth = 1120
  const padding = 16
  const gap = 24
  const originalSize = defaultBlockSize(originalBlock.type)
  const originalX = Number(originalBlock.props?.x ?? padding)
  const originalY = Number(originalBlock.props?.y ?? padding)
  const originalW = Number(originalBlock.props?.width ?? originalSize.width)
  const originalH = Number(originalBlock.props?.height ?? originalSize.height)

  const occupied = existingBlocks.map((b) => {
    const s = defaultBlockSize(b.type)
    return {
      x: Number(b.props?.x ?? padding),
      y: Number(b.props?.y ?? padding),
      width: Number(b.props?.width ?? s.width),
      height: Number(b.props?.height ?? s.height),
    }
  })

  const preferred = [
    { x: originalX + originalW + gap, y: originalY },
    { x: originalX, y: originalY + originalH + gap },
    { x: padding, y: originalY },
  ]

  for (const spot of preferred) {
    const w = Math.max(180, originalW)
    const h = Math.max(120, originalH)
    const candidate = {
      x: Math.max(padding, Math.round(spot.x)),
      y: Math.max(padding, Math.round(spot.y)),
      width: w,
      height: h,
    }

    if (candidate.x + candidate.width > canvasWidth - padding) continue
    const hit = occupied.some((o) => overlaps(candidate, o))
    if (!hit) return { x: candidate.x, y: candidate.y }
  }

  return findFreeSpot(existingBlocks, originalBlock.type)
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
  const defaultSections = createTemplateSections('starter')
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

  const chart = (type, x, y, width, height, title, extraProps = {}) => ({
    id: nextBlockId(),
    type,
    props: {
      ...DEFAULT_BLOCK_PROPS,
      title,
      x,
      y,
      width,
      height,
      ...extraProps,
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

  const s1 = { id: nextSectionId(), title: 'Section 1', cols: 12, blocks: [], colSpanMap: {} }
  s1.blocks = [
    chart('stat-total', 12, 16, 194, 120, 'Total Patients Screened', {
      metricValue: '2,568',
      metricDelta: '▲ 15.6%',
      comparisonLabel: 'vs Apr 1 - Apr 30, 2025',
    }),
    chart('stat-tests', 214, 16, 194, 120, 'Tests Conducted', {
      metricValue: '4,231',
      metricDelta: '▲ 12.7%',
      comparisonLabel: 'vs Apr 1 - Apr 30, 2025',
    }),
    chart('stat-positive', 416, 16, 194, 120, 'Positive Cases', {
      metricValue: '312',
      metricDelta: '▼ 15.3%',
      comparisonLabel: 'vs Apr 1 - Apr 30, 2025',
    }),
    chart('stat-locations', 618, 16, 194, 120, 'Referred', {
      metricValue: '186',
      metricDelta: '▲ 8.1%',
      comparisonLabel: 'vs Apr 1 - Apr 30, 2025',
    }),
  ]
  return [s1]
}

// â”€â”€ Flat block lookup helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [showDraftBadge, setShowDraftBadge] = useState(true)
  const [browserMode, setBrowserMode] = useState(getResponsiveMode)
  const [previewMode, setPreviewMode] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [autoThemeTick, setAutoThemeTick] = useState(() => Date.now())
  const rootRef = useRef(null)

  const { sections, history, index, title, subtitle } = dashboardState
  const responsiveMode = previewMode || browserMode
  const effectiveTheme = settings.themeMode === 'scheduled'
    ? settings.scheduleEnabled
      ? getScheduledTheme(settings, new Date(autoThemeTick))
      : 'light'
    : settings.themeMode

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

  useEffect(() => {
    setShowDraftBadge(true)
  }, [dashboardState])

  useEffect(() => {
    if (selectedId && !isPreviewMode) {
      setRightOpen(true)
    }
  }, [isPreviewMode, selectedId])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = effectiveTheme
    root.dataset.themeMode = settings.themeMode
    root.dataset.layoutDensity = settings.dashboardLayout
    root.dataset.gridDensity = settings.gridDensity
    root.dataset.highContrast = settings.highContrast ? 'true' : 'false'
    root.dataset.screenReader = settings.screenReader ? 'true' : 'false'
    root.classList.toggle('dark', effectiveTheme === 'dark')
    root.style.setProperty('--app-font-scale', `${settings.fontScale / 100}`)
    root.style.setProperty('--accent-color', settings.accentColor)
    root.style.setProperty('--accent-soft', `${settings.accentColor}18`)
    root.style.setProperty('--accent-border', `${settings.accentColor}52`)
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage failures
    }
  }, [effectiveTheme, settings])

  useEffect(() => {
    if (settings.themeMode !== 'scheduled' || !settings.scheduleEnabled) return undefined
    const interval = window.setInterval(() => setAutoThemeTick(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [settings.scheduleEnabled, settings.themeMode])

  useEffect(() => {
    const minutes = Number(settings.autoRefreshInterval)
    if (!minutes) return undefined
    const interval = window.setInterval(() => refetch?.(), minutes * 60_000)
    return () => window.clearInterval(interval)
  }, [refetch, settings.autoRefreshInterval])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
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
      setShowDraftBadge(false)
    } catch {
      // ignore storage failures
    }
  }, [dashboardState])

  // â”€â”€ History Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Section operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Block operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      let clonedBlockId = null
      const nextSections = prev.sections.map((s) => {
        if (sectionId && s.id !== sectionId) return s
        const blocks = s.blocks || []
        const idx = blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return s
        const original = blocks[idx]
        const newId = nextBlockId()
        const originalW = Number(original.props?.width ?? defaultBlockSize(original.type).width)
        const originalH = Number(original.props?.height ?? defaultBlockSize(original.type).height)
        const duplicateSpot = {
          x: Math.max(16, Math.round(Number(original.props?.x ?? 16) + 14)),
          y: Math.max(16, Math.round(Number(original.props?.y ?? 16) + 14)),
        }
        const maxX = Math.max(16, 1120 - originalW - 16)
        const maxY = Math.max(16, 3000 - originalH - 16)
        const clone = {
          ...original,
          id: newId,
          props: { 
            ...DEFAULT_BLOCK_PROPS, 
            ...original.props,
            x: Math.min(duplicateSpot.x, maxX),
            y: Math.min(duplicateSpot.y, maxY),
          },
        }
        clonedBlockId = newId
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
    if (clonedBlockId) {
      setTimeout(() => setSelectedId(clonedBlockId), 0)
    }
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

  // â”€â”€ Clear â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        backgroundColor: effectiveTheme === 'dark' ? '#020817' : '#ffffff',
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
  }, [effectiveTheme, isExporting])

  const downloadPatientData = useCallback(() => {
    const rows = data.patientTableData || []
    const headers = ['Drive Name', 'Location', 'Date', 'Patients Screened', 'Positive Cases', 'Referred']
    const csvRows = [
      headers.join(','),
      ...rows.map((row) => [
        row.name,
        row.location,
        row.date,
        row.screened,
        row.positive,
        row.referred,
      ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patient-data-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [data.patientTableData])

  // â”€â”€ Keyboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
    if (e.key === 'Delete' && selectedId) { removeBlock(selectedId) }
    if (e.key === 'Escape') { setSelectedId(null) }
  }, [undo, redo, selectedId, removeBlock])

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        showDraftBadge={showDraftBadge}
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
        settings={settings}
        effectiveTheme={effectiveTheme}
        onSettingsChange={updateSettings}
        onRefreshData={refetch}
        onDownloadPatientData={downloadPatientData}
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

