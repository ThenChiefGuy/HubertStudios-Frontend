"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DialogTrigger } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { BanDialog } from "@/components/dashboard/ban-dialog"
import { fetchBans, fetchPlugins, deleteBan, ApiError, type ApiBan, type ApiPlugin } from "@/lib/api"
import { cn } from "@/lib/utils"

const filters = [
  { key: "all", label: "All" },
  { key: "global", label: "Global bans" },
  { key: "plugin", label: "Plugin-specific" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
] as const

type FilterKey = (typeof filters)[number]["key"]

export default function ServerBansPage() {
  const [filter, setFilter] = useState<FilterKey>("all")
  const [bans, setBans] = useState<ApiBan[]>([])
  const [plugins, setPlugins] = useState<ApiPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [unbanningId, setUnbanningId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError("")
    Promise.all([fetchBans(), fetchPlugins()])
      .then(([b, p]) => {
        setBans(b)
        setPlugins(p)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load server bans."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function handleSaved(ban: ApiBan) {
    setBans((prev) => {
      const idx = prev.findIndex((b) => b.id === ban.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = ban
        return updated
      }
      return [ban, ...prev]
    })
  }

  async function handleUnban(id: string, identifier: string) {
    setUnbanningId(id)
    try {
      await deleteBan(id)
      setBans((prev) => prev.filter((b) => b.id !== id))
      toast.success(`Unbanned ${identifier}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove the ban.")
    } finally {
      setUnbanningId(null)
    }
  }

  const rows = useMemo(() => {
    return bans.filter((b) => {
      switch (filter) {
        case "global":
          return b.plugin === null
        case "plugin":
          return b.plugin !== null
        case "active":
          return b.status === "active"
        case "expired":
          return b.status === "expired"
        default:
          return true
      }
    })
  }, [filter, bans])

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
        title="Server Bans"
        description="Block abusive servers globally or per plugin."
        action={
          <BanDialog
            plugins={plugins}
            onSaved={handleSaved}
            trigger={
              <DialogTrigger render={<Button />}>
                <Plus className="size-4" />
                Add server ban
              </DialogTrigger>
            }
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead>Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.plugin ? (
                        <span className="font-medium">{b.plugin}</span>
                      ) : (
                        <StatusBadge tone="warning">Global</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {b.identifier}
                    </TableCell>
                    <TableCell className="hidden max-w-[260px] truncate text-sm text-muted-foreground md:table-cell">
                      {b.reason}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {b.until ?? "Permanent"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={b.status === "active" ? "danger" : "muted"}>
                        {b.status === "active" ? "Active" : "Expired"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <BanDialog
                          ban={b}
                          plugins={plugins}
                          onSaved={handleSaved}
                          trigger={
                            <DialogTrigger render={<Button variant="ghost" size="sm" />}>
                              Edit
                            </DialogTrigger>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={unbanningId === b.id}
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleUnban(b.id, b.identifier)}
                        >
                          {unbanningId === b.id ? <Loader2 className="size-4 animate-spin" /> : null}
                          Unban
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No bans match this filter.
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