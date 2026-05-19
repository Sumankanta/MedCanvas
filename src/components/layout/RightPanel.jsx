import { useState } from 'react'
import {
  BarChart3,
  Columns3,
  GripVertical,
  LineChart,
  PieChart,
  Search,
  Table2,
  X,
  TrendingUp,
  Target,
  Hash,
  Minus,
} from 'lucide-react'

const GROUPS = [
  {
    title: 'Summary',
    items: [
      { type: 'stat-total',     name: 'Number Callout',      Icon: Hash },
      { type: 'num',            name: 'Stat Card',           Icon: BarChart3 },
      { type: 'stat-positive',  name: 'Progress Indicator',  Icon: Target },
      { type: 'stat-normal',    name: 'Trend Indicator',     Icon: TrendingUp },
    ],
  },
  {
    title: 'Charts',
    items: [
      { type: 'chart-bar',       name: 'Bar Chart',         Icon: BarChart3 },
      { type: 'chart-line',      name: 'Line Chart',        Icon: LineChart },
      { type: 'chart-area',      name: 'Area Chart',        Icon: LineChart },
      { type: 'chart-pie',       name: 'Pie/Donut Chart',   Icon: PieChart },
      { type: 'chart-stacked',   name: 'Column Chart',      Icon: Columns3 },
      { type: 'chart-radialbar', name: 'Gauge Chart',       Icon: Target },
      { type: 'chart-donut',     name: 'Funnel Chart',      Icon: PieChart },
      { type: 'chart-scatter',   name: 'Radar Chart',       Icon: Target },
      { type: 'chart-hbar',      name: 'Heatmap',           Icon: BarChart3 },
      { type: 'chart-radialbar', name: 'Map Chart',         Icon: Target },
    ],
  },
  {
    title: 'Data',
    items: [
      { type: 'table', name: 'Table',          Icon: Table2 },
      { type: 'table', name: 'Advanced Table',  Icon: Table2 },
      { type: 'table', name: 'Pivot Table',     Icon: Table2 },
    ],
  },
  {
    title: 'Layout',
    items: [
      { type: 'num',          name: 'Row',        Icon: Minus },
      { type: 'num',          name: 'Column',     Icon: Columns3 },
      { type: 'num',          name: 'Text / Title', Icon: Hash },
      { type: 'chart-pie',    name: 'Image',      Icon: PieChart },
      { type: 'num',          name: 'Divider',    Icon: Minus },
      { type: 'num',          name: 'Spacer',     Icon: Columns3 },
    ],
  },
]

function WidgetButton({ item, onAddBlock }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('blockType', item.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <button
      className="widget-list-item"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAddBlock(item.type)}
      title={item.name}
    >
      <item.Icon size={14} />
      <span>{item.name}</span>
      <GripVertical size={12} className="widget-grip" />
    </button>
  )
}

export default function RightPanel({ side = 'right', open = true, onAddBlock, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGroups = GROUPS.map((group) => {
    if (!searchQuery.trim()) return group
    const q = searchQuery.toLowerCase()
    const filtered = group.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    )
    return { ...group, items: filtered }
  }).filter((group) => group.items.length > 0)

  return (
    <aside className={`${side}-panel widget-library${open ? '' : ' collapsed'}`}>
      <div className="panel-header">
        <span className="panel-title">Widgets</span>
        <button className="panel-close" onClick={onClose}><X size={12} /></button>
      </div>

      <div className="widget-search">
        <Search size={14} />
        <input
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="panel-body widgets-body">
        {filteredGroups.length === 0 && (
          <div style={{ textAlign: 'center', color: '#98a2b3', fontSize: 12, padding: '20px 0' }}>
            No widgets match "{searchQuery}"
          </div>
        )}
        {filteredGroups.map((group) => (
          <div className="widget-group" key={group.title}>
            <div className="widget-group-title">{group.title}</div>
            <div className="widget-list">
              {group.items.map((item, index) => (
                <WidgetButton key={`${group.title}-${item.type}-${index}`} item={item} onAddBlock={onAddBlock} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="widget-drop-help">
        <GripVertical size={18} />
        <span>Drag widgets to design your dashboard</span>
      </div>
    </aside>
  )
}
