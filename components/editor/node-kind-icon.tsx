import {
  AppWindow,
  Box,
  Cog,
  Database,
  DatabaseZap,
  Globe,
  HardDrive,
  Inbox,
  KeyRound,
  MonitorSmartphone,
  Search,
  Server,
  Split,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { NodeKindId } from "@/types/canvas"

const NODE_KIND_ICONS: Record<NodeKindId, LucideIcon> = {
  client: MonitorSmartphone,
  frontend: AppWindow,
  gateway: Waypoints,
  "load-balancer": Split,
  service: Server,
  worker: Cog,
  function: Zap,
  database: Database,
  cache: DatabaseZap,
  queue: Inbox,
  storage: HardDrive,
  search: Search,
  auth: KeyRound,
  external: Globe,
  generic: Box,
}

interface NodeKindIconProps {
  kind: NodeKindId
  className?: string
}

/** The stroke-only icon for a node kind. Decorative: the kind is named in text. */
function NodeKindIcon({ kind, className }: NodeKindIconProps) {
  const Icon = NODE_KIND_ICONS[kind]

  return <Icon aria-hidden="true" className={cn("size-3.5", className)} />
}

export { NodeKindIcon }
