"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DialogTrigger } from "@/components/ui/dialog"
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
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { LicenseDialog } from "@/components/dashboard/license-dialog"
import { fetchLicenses, fetchPlugins, ApiError, type ApiLicense, type ApiPlugin } from "@/lib/api"

const statusTone: Record<ApiLicense["status"], "success" | "warning" | "danger"> = {
  active: "success",
  expired: "warning",
  revoked: "danger",
}

export default function LicensesPage() {
  const [query, setQuery] = useState("")
  const [plugin, setPlugin] = useState("all")
  const [status, setStatus] = useState("all")
  const [licenses, setLicenses] = useState<ApiLicense[]>([])
  const [plugins, setPlugins] = useState<ApiPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  function load() {
    setLoading(true)
    setError("")
    Promise.all([fetchLicenses(), fetchPlugins()])
      .then(([l, p]) => {
        setLicenses(l)
        setPlugins(p)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load licenses."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function handleSaved(license: ApiLicense) {
    setLicenses((prev) => {
      const exists = prev.some((l) => l.id === license.id)
      return exists
        ? prev.map((l) => (l.id === license.id ? license : l))
        : [license, ...prev]
    })
  }

  const filtered = useMemo(() => {
    return licenses.filter((l) => {
      const matchQuery =
        l.key.toLowerCase().includes(query.toLowerCase()) ||
        l.label.toLowerCase().includes(query.toLowerCase())
      const matchPlugin = plugin === "all" || l.plugin === plugin
      const matchStatus = status === "all" || l.status === status
      return matchQuery && matchPlugin && matchStatus
    })
  }, [query, plugin, status, licenses])

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
        title="Global Licenses"
        description="Plugins are free — these global keys exist purely for security. Issue a global key per plugin with a fixed duration."
        action={
          <LicenseDialog
            plugins={plugins}
            onSaved={handleSaved}
            trigger={
              <DialogTrigger render={<Button />}>
                <Plus className="size-4" />
                Add license
              </DialogTrigger>
            }
          />
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by key or label..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="hidden lg:table-cell">Servers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.plugin}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.key}</TableCell>
                    <TableCell className="whitespace-nowrap">{l.label}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{l.duration}</TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone[l.status]}>
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {l.expiry ?? "Never"}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">
                      {l.servers.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <LicenseDialog
                        license={l}
                        plugins={plugins}
                        onSaved={handleSaved}
                        trigger={
                          <DialogTrigger render={<Button variant="ghost" size="sm" />}>
                            Edit
                          </DialogTrigger>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No licenses match your filters.
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