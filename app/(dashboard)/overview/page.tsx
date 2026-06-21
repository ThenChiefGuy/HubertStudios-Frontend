"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Boxes,
  KeyRound,
  ShieldBan,
  Server,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  fetchOverview,
  fetchAuditLog,
  fetchBans,
  ApiError,
  type ApiOverviewStats,
  type ApiAuditEvent,
  type ApiBan,
} from "@/lib/api"

export default function OverviewPage() {
  const [stats, setStats] = useState<ApiOverviewStats | null>(null)
  const [events, setEvents] = useState<ApiAuditEvent[]>([])
  const [bans, setBans] = useState<ApiBan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [s, evs, bns] = await Promise.all([
        fetchOverview(),
        fetchAuditLog(),
        fetchBans(),
      ])
      setStats(s)
      setEvents(evs)
      setBans(bns)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load overview data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blockedGlobal = bans.filter((b) => b.status === "active" && b.plugin === null).length
  const blockedScoped = bans.filter((b) => b.status === "active" && b.plugin !== null).length
  const blockedTotal = blockedGlobal + blockedScoped
  const blockedHint =
    blockedTotal === 0
      ? ""
      : `${blockedGlobal} global${blockedScoped ? ", " + blockedScoped + " scoped" : ""}`

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
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live snapshot of your licensing infrastructure."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Plugins"
          value={String(stats?.activePlugins ?? 0)}
          hint={`of ${stats?.totalPlugins ?? 0} total`}
          icon={Boxes}
        />
        <StatCard
          label="Global Licenses"
          value={String(stats?.activeLicenses ?? 0)}
          hint={`of ${stats?.totalLicenses ?? 0} total`}
          icon={KeyRound}
        />
        <StatCard
          label="Active Servers"
          value={String(stats?.totalServersSeen ?? 0)}
          hint={`${stats?.onlineServers ?? 0} online now`}
          icon={Server}
        />
        <StatCard
          label="Blocked Servers"
          value={String(blockedTotal)}
          hint={blockedHint}
          icon={ShieldBan}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/plugins" />}>
            <Plus className="size-4" />
            Add Plugin
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/licenses" />}>
            <Plus className="size-4" />
            Add License
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/server-bans" />}>
            <Plus className="size-4" />
            Add Server Ban
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent audit events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 5).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {e.time}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{e.admin}</TableCell>
                    <TableCell>
                      <StatusBadge tone="info">{e.action}</StatusBadge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {e.details}
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No audit events available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}