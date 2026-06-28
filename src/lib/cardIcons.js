// Shared icon registry for dashboard cards.
// Picks from lucide-react so the user can change icons dynamically.
import {
  Users,
  UserRound,
  ClipboardList,
  FlaskConical,
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  Syringe,
  Microscope,
  Hospital,
  Thermometer,
  Brain,
  Bone,
  Eye,
  Baby,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  XCircle,
  CircleDot,
  Calendar,
  MapPin,
  Hash,
  DollarSign,
  Percent,
  Gauge,
  Award,
  Star,
  Zap,
} from 'lucide-react'

// Curated set of icons. Keys are stable identifiers stored in props.iconKey.
export const CARD_ICON_LIBRARY = {
  users: { Icon: Users, label: 'Users' },
  user: { Icon: UserRound, label: 'User' },
  clipboard: { Icon: ClipboardList, label: 'Clipboard' },
  flask: { Icon: FlaskConical, label: 'Flask' },
  activity: { Icon: Activity, label: 'Activity' },
  heart: { Icon: HeartPulse, label: 'Heart Pulse' },
  stethoscope: { Icon: Stethoscope, label: 'Stethoscope' },
  pill: { Icon: Pill, label: 'Pill' },
  syringe: { Icon: Syringe, label: 'Syringe' },
  microscope: { Icon: Microscope, label: 'Microscope' },
  hospital: { Icon: Hospital, label: 'Hospital' },
  thermometer: { Icon: Thermometer, label: 'Thermometer' },
  brain: { Icon: Brain, label: 'Brain' },
  bone: { Icon: Bone, label: 'Bone' },
  eye: { Icon: Eye, label: 'Eye' },
  baby: { Icon: Baby, label: 'Baby' },
  shield: { Icon: ShieldCheck, label: 'Shield' },
  alert: { Icon: AlertTriangle, label: 'Alert' },
  trendUp: { Icon: TrendingUp, label: 'Trend Up' },
  trendDown: { Icon: TrendingDown, label: 'Trend Down' },
  target: { Icon: Target, label: 'Target' },
  check: { Icon: CheckCircle2, label: 'Check' },
  cross: { Icon: XCircle, label: 'Cross' },
  dot: { Icon: CircleDot, label: 'Dot' },
  calendar: { Icon: Calendar, label: 'Calendar' },
  pin: { Icon: MapPin, label: 'Map Pin' },
  hash: { Icon: Hash, label: 'Hash' },
  dollar: { Icon: DollarSign, label: 'Currency' },
  percent: { Icon: Percent, label: 'Percent' },
  gauge: { Icon: Gauge, label: 'Gauge' },
  award: { Icon: Award, label: 'Award' },
  star: { Icon: Star, label: 'Star' },
  zap: { Icon: Zap, label: 'Zap' },
}

// Resolve an icon component by key, falling back to a default.
export function getCardIcon(key, fallback = Users) {
  if (!key) return fallback
  const entry = CARD_ICON_LIBRARY[key]
  return entry?.Icon || fallback
}

export const CARD_ICON_KEYS = Object.keys(CARD_ICON_LIBRARY)
