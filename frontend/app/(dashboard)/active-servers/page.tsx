"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Server,
  Users,
  Wifi,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchActiveServers,
  fetchPlugins,
  ApiError,
  type ApiActiveServer,
  type ApiPlugin,
} from "@/lib/api"

const REFRESH_INTERVAL_MS = 30_000

export default function ActiveServersPage() {
  const [query, setQuery] = useState("")
  const [plugin, setPlugin] = useState("all")
  const [status, setStatus] = useState("all")
  const [servers, setServers] = useState<ApiActiveServer[]>([])
  const [plugins, setPlugins] = useState<ApiPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  function load(opts: { silent?: boolean } = {}) {
    if (opts.silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    Promise.all([fetchActiveServers(), fetchPlugins()])
      .then(([s, p]) => {
        setServers(s)
        setPlugins(p)
      })
      .catch((err) => {
        if (!opts.silent) setError(err instanceof ApiError ? err.message : "Could not load active servers.")
      })
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => load({ silent: true }), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      const matchesQuery =
        s.address.toLowerCase().includes(query.toLowerCase()) ||
        s.country.toLowerCase().includes(query.toLowerCase())
      const matchesPlugin = plugin === "all" || s.plugin === plugin
      const matchesStatus = status === "all" || s.status === status
      return matchesQuery && matchesPlugin && matchesStatus
    })
  }, [query, plugin, status, servers])

  const onlineCount = servers.filter((s) => s.status === "online").length
  const totalPlayers = servers
    .filter((s) => s.status === "online")
    .reduce((sum, s) => sum + s.players, 0)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => load()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Active Servers"
        description="Live servers that currently have a HubertStudios plugin installed and validating."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => load({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total servers" value={servers.length.toString()} icon={Server} />
        <StatCard label="Online now" value={onlineCount.toString()} icon={Wifi} />
        <StatCard label="Players online" value={totalPlayers.toLocaleString()} icon={Users} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base">Connected servers</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search address or country"
                className="pl-9"
              />
            </div>
            <Select value={plugin} onValueChange={setPlugin}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Plugin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plugins</SelectItem>
                {plugins.map((p) => (
                  <SelectItem key={p.id} value={p.displayName}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server address</TableHead>
                  <TableHead>Plugin</TableHead>
                  <TableHead className="hidden sm:table-cell">Version</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="hidden lg:table-cell">Last seen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.address}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.plugin}</TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground sm:table-cell">
                      {s.version}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {s.country}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.status === "online" ? s.players.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">
                      {s.lastSeen}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={s.status === "online" ? "success" : "muted"}>
                        {s.status === "online" ? "Online" : "Offline"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No servers match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}