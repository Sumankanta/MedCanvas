<div align="center">
  <br />
  <img src="src/assets/hero.png" alt="MedCanvas Banner" width="50%" style="border-radius: 12px" />
  <br /><br />

  <h1>🏥 MedCanvas</h1>
  <p><strong>A drag-and-drop medical dashboard builder for healthcare teams.</strong><br/>
  Drop charts onto a live canvas, edit data in real time, restyle in seconds — no code required.</p>

  <br />

  ![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
  ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square)
  ![dnd-kit](https://img.shields.io/badge/@dnd--kit-FF6B6B?style=flat-square)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

  <br /><br />

  [**Live Demo**](#) · [**Documentation**](#) · [**Report a Bug**](../../issues) · [**Request a Feature**](../../issues)

  <br />

</div>

---

## ✦ What is MedCanvas?

MedCanvas is an open-source, interactive dashboard builder designed for healthcare professionals. It gives clinicians and analysts a **no-code canvas** to compose, customize, and share medical data visualizations — all in a single browser tab.

> **The core idea:** Instead of rebuilding charts in Excel every time the data changes, MedCanvas lets you drop widgets onto a freeform canvas, pivot axes on the fly, and share a live view instead of a static file.

<br />

## ✦ Features

| | Feature | Description |
|---|---|---|
| 🖱️ | **Freeform canvas** | Place, move, and resize any widget anywhere — absolute positioning with pixel precision |
| 📊 | **4 chart types** | Bar, Line, Area, and Pie charts via Recharts — all responsive and fully styleable |
| 🃏 | **Stat cards & widgets** | Pre-built KPI tiles for patient flow, revenue, appointments, and alerts |
| ✏️ | **Live data editing** | Edit the raw data behind any chart directly in a modal table — no code, no files |
| 🔁 | **Undo / Redo** | Full snapshot history — every action is reversible with `Ctrl+Z` / `Ctrl+Y` |
| 🎨 | **Deep customization** | Change colors, stroke width, bar radius, axis keys, and titles per widget |
| 📐 | **Drag to resize** | Drag the bottom-right corner of any widget — chart auto-scales to fill the space |
| 🔄 | **Axis pivoting** | Remap chart axes to different data fields live — same data, new perspective |
| 🔀 | **Section reorder** | Drag entire dashboard sections into a new order via keyboard-accessible handles |

<br />

## ✦ Tech Stack

```
React 18          →  UI framework & component state
Vite              →  Build tool & dev server
Recharts 2.x      →  SVG chart engine (Bar, Line, Area, Pie)
@dnd-kit/core     →  Accessible section drag-and-drop sorting
HTML5 DnD API     →  Widget drag from panel → canvas
Tailwind CSS 3    →  Utility-first styling
clsx + twMerge    →  Conditional class merging & conflict resolution
shadcn/ui         →  Accessible base components (Button, Badge, Card)
```

<br />

## ✦ Project Structure

```
src/
├── App.jsx                        # 🧠 State owner — dashboard data, history, all callbacks
│
├── components/
│   ├── canvas/
│   │   ├── CanvasArea.jsx         # Section list + @dnd-kit sortable context
│   │   ├── CanvasSection.jsx      # Section host — custom mouse DnD for widgets
│   │   └── CanvasBlock.jsx        # Polymorphic widget renderer (charts + stat cards)
│   │
│   ├── layout/
│   │   ├── TopBar.jsx             # Global actions: Refresh, Undo/Redo, Add Section
│   │   ├── LeftPanel.jsx          # Context-aware config sidebar for selected widget
│   │   └── RightPanel.jsx         # Widget library — drag new charts onto canvas
│   │
│   ├── builder/
│   │   ├── BlockPanel.jsx         # Block type selector panel
│   │   └── PreviewCanvas.jsx      # Live preview of dashboard layout
│   │
│   ├── widgets/
│   │   ├── AlertsWidget.jsx       # Medical alerts feed widget
│   │   ├── AppointmentChart.jsx   # Appointment schedule visualization
│   │   ├── PatientFlowChart.jsx   # Patient intake & discharge flow
│   │   ├── RevenueChart.jsx       # Financial metrics chart
│   │   └── SortableWidget.jsx     # Drag handle wrapper for any widget
│   │
│   ├── ui/
│   │   ├── button.jsx             # Base button component
│   │   ├── badge.jsx              # Status badge component
│   │   └── card.jsx               # Card container component
│   │
│   └── StatCard.jsx               # KPI metric tile (single number + label)
│
├── hooks/
│   └── useDashboardData.js        # Data fetch lifecycle (loading, data, refetch)
│
├── data/
│   └── mockData.js                # Static medical datasets for development
│
├── lib/
│   └── utils.js                   # cn() — Tailwind class merging utility
│
└── main.jsx                       # App entry point
```

<br />

## ✦ Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0 (or `yarn` / `pnpm`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/medcanvas.git
cd medcanvas

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the dashboard loads with mock medical data.

### Build for Production

```bash
npm run build    # outputs to /dist
npm run preview  # serve the production build locally
```

<br />

## ✦ How It Works

MedCanvas is built around three core systems that work together:

### 1 — Drag & Drop (3 independent systems)

| System | Library | Used For |
|---|---|---|
| Section reorder | `@dnd-kit` | Drag entire rows up/down via grip handles |
| Widget move & resize | Custom `mousemove` | Pixel-accurate free positioning inside a section |
| Drop new widgets | `HTML5 DnD API` | Tear a chart from the Right Panel onto the canvas |

### 2 — Rendering Pipeline

```
User drops a chart
       ↓
addBlockToSection()   →   makeBlock(type) assigns a unique ID + default props
       ↓
dashboardState        →   pushState() saves a history snapshot
       ↓
CanvasBlock           →   reads block.type, routes to renderChart() or renderStatBlock()
       ↓
Recharts              →   draws SVG inside a ResponsiveContainer that tracks resize
```

### 3 — Data Update Channels

```
Global refresh    →  refetch() in useDashboardData re-renders all charts at once
Manual edit       →  DataEditor modal → onUpdateBlock(id, { data: rows }) → per-widget override
Axis pivot        →  LeftPanel dropdown → updateBlockProps(id, { yKey: 'newField' }) → instant redraw
```

<br />

## ✦ Key Functions

| Function | File | What It Does |
|---|---|---|
| `useDashboardData()` | `hooks/` | Manages global data fetch — exposes `data`, `loading`, `refetch` |
| `pushState(sections)` | `App.jsx` | Saves a layout snapshot for undo/redo |
| `addSection(type?)` | `App.jsx` | Creates a new canvas row, optionally pre-populated |
| `addBlockToSection(id, type)` | `App.jsx` | Inserts a new widget into an existing section |
| `updateBlockProps(id, patch)` | `App.jsx` | Surgically merges a style or data change into one block |
| `renderChart(type, data, props)` | `CanvasBlock.jsx` | Dispatches `block.type` to the correct Recharts component |
| `cn(...inputs)` | `lib/utils.js` | Merges Tailwind classes, resolves conflicts via `twMerge` |

<br />

## ✦ Adding a New Chart Type

Three steps to register a new visualization:

**1. Define defaults** in `CanvasBlock.jsx`:
```js
const CFG = {
  'chart-scatter': {
    title: 'BMI vs Age',
    color: '#8B5CF6',
    xKey: 'age',
    yKey: 'bmi',
  }
}
```

**2. Add a render case** inside `renderChart()` in `CanvasBlock.jsx`:
```jsx
if (type === 'chart-scatter') {
  return (
    <ScatterChart data={data}>
      <XAxis dataKey={props.xKey} />
      <YAxis dataKey={props.yKey} />
      <Scatter fill={props.color} />
    </ScatterChart>
  );
}
```

**3. Add a card to the widget library** in `RightPanel.jsx`:
```jsx
{ type: 'chart-scatter', label: 'Scatter Plot', icon: <ScatterIcon /> }
```

<br />

## ✦ Supported Widgets

| Widget | Type Key | Best For |
|---|---|---|
| Bar Chart | `chart-bar` | Category comparisons |
| Line Chart | `chart-line` | Trends over time |
| Area Chart | `chart-area` | Cumulative volume |
| Pie Chart | `chart-pie` | Part-to-whole ratios |
| Stat Card | `stat-*` | Single KPI numbers |
| Alerts Widget | built-in | Medical alert feeds |
| Appointment Chart | built-in | Schedule overview |
| Patient Flow | built-in | Intake & discharge tracking |
| Revenue Chart | built-in | Financial performance |

<br />

## ✦ Contributing

Contributions are welcome. Please open an issue before submitting a large PR.

```bash
# Fork → clone → branch
git checkout -b feat/your-feature-name

# Make your changes, then
git commit -m "feat: describe your change"
git push origin feat/your-feature-name

# Open a Pull Request against main
```

**Commit message convention:** `feat:` · `fix:` · `docs:` · `refactor:` · `chore:`

<br />

## ✦ Roadmap

- [ ] Export dashboard as PNG / PDF
- [ ] Save & load dashboard layouts (JSON import/export)
- [ ] Real API integration (replace `mockData.js`)
- [ ] Multi-user collaboration via WebSockets
- [ ] Dark mode support
- [ ] Mobile-responsive layout mode

<br />

## ✦ License

MIT © MedCanvas Contributors — see [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <br />
  <sub>Built for healthcare teams who deserve better tools than spreadsheets.</sub>
  <br /><br />
  <a href="#">↑ Back to top</a>
</div>
