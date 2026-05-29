import {
  Gauge, TriangleAlert, Upload, FileJson, ShieldCheck, Search,
  X, ChevronRight, ChevronLeft, Check, Clock, ArrowUpRight, UserRound,
  Zap, CircleDollarSign, MapPin, Database, Braces, Shield, Globe,
  RefreshCw, Filter, Map, AlertTriangle, Eye, Download, MoreHorizontal,
  ArrowUp, ArrowDown, TrendingUp, Activity, Users, FileText,
} from 'lucide-react';

const ICONS = {
  'gauge': Gauge,
  'triangle-alert': TriangleAlert,
  'upload': Upload,
  'file-json': FileJson,
  'shield-check': ShieldCheck,
  'search': Search,
  'x': X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'check': Check,
  'clock': Clock,
  'arrow-up-right': ArrowUpRight,
  'user-round': UserRound,
  'zap': Zap,
  'circle-dollar-sign': CircleDollarSign,
  'map-pin': MapPin,
  'database': Database,
  'braces': Braces,
  'shield': Shield,
  'globe': Globe,
  'refresh-cw': RefreshCw,
  'filter': Filter,
  'map': Map,
  'alert-triangle': AlertTriangle,
  'eye': Eye,
  'download': Download,
  'more-horizontal': MoreHorizontal,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'trending-up': TrendingUp,
  'activity': Activity,
  'users': Users,
  'file-text': FileText,
};

export function Icon({ name, size = 18, color, className, style, strokeWidth = 1.75 }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return (
    <Component
      size={size}
      color={color}
      className={className}
      style={style}
      strokeWidth={strokeWidth}
    />
  );
}
