import {
  BarChart3,
  CalendarRange,
  Columns3,
  Donut,
  Gauge,
  GripVertical,
  Image,
  LineChart,
  MapPin,
  Minus,
  PieChart,
  Search,
  Table2,
  Text,
  X,
} from 'lucide-react'

const GROUPS = [
  {
    title: 'Summary',
    items: [
      { type: 'stat-total', name: 'Number Callout', Icon: BarChart3 },
      { type: 'num', name: 'Stat Card', Icon: Table2 },
      { type: 'chart-radialbar', name: 'Progress Indicator', Icon: Gauge },
      { type: 'chart-line', name: 'Trend Indicator', Icon: LineChart },
    ],
  },
  {
    title: 'Charts',
    items: [
      { type: 'chart-bar', name: 'Bar Chart', Icon: BarChart3 },
      { type: 'chart-line', name: 'Line Chart', Icon: LineChart },
      { type: 'chart-area', name: 'Area Chart', Icon: LineChart },
      { type: 'chart-pie', name: 'Pie/Donut Chart', Icon: Donut },
      { type: 'chart-stacked', name: 'Column Chart', Icon: Columns3 },
      { type: 'chart-radialbar', name: 'Gauge Chart', Icon: Gauge },
      { type: 'chart-bar', name: 'Funnel Chart', Icon: PieChart },
      { type: 'chart-scatter', name: 'Radar Chart', Icon: MapPin },
      { type: 'chart-donut', name: 'Heatmap', Icon: Donut },
      { type: 'chart-radialbar', name: 'Map Chart', Icon: MapPin },
    ],
  },
  {
    title: 'Data',
    items: [
      { type: 'table', name: 'Table', Icon: Table2 },
      { type: 'table', name: 'Advanced Table', Icon: Table2 },
      { type: 'table', name: 'Pivot Table', Icon: Table2 },
    ],
  },
  {
    title: 'Layout',
    items: [
      { type: 'chart-bar', name: 'Row', Icon: Minus },
      { type: 'chart-line', name: 'Column', Icon: Columns3 },
      { type: 'num', name: 'Text / Title', Icon: Text },
      { type: 'chart-donut', name: 'Image', Icon: Image },
      { type: 'chart-area', name: 'Divider', Icon: Minus },
      { type: 'chart-scatter', name: 'Spacer', Icon: CalendarRange },
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
  return (
    <aside className={`${side}-panel widget-library${open ? '' : ' collapsed'}`}>
      <div className="panel-header">
        <span className="panel-title">Widgets</span>
        <button className="panel-close" onClick={onClose}><X size={12} /></button>
      </div>

      <div className="widget-search">
        <Search size={14} />
        <input placeholder="Search widgets..." />
      </div>

      <div className="panel-body widgets-body">
        {GROUPS.map((group) => (
          <div className="widget-group" key={group.title}>
            <div className="widget-group-title">{group.title}</div>
            <div className="widget-list">
              {group.items.map((item, index) => (
                <WidgetButton key={`${group.title}-${item.name}-${index}`} item={item} onAddBlock={onAddBlock} />
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
