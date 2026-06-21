"use client"

import { useEffect, useState } from "react"
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
import { BuildDialog } from "@/components/dashboard/build-dialog"
import { fetchBuilds, fetchPlugins, deleteBuild, ApiError, type ApiBuild, type ApiPlugin } from "@/lib/api"

export default function BuildsPage() {
  const [builds, setBuilds] = useState<ApiBuild[]>([])
  const [plugins, setPlugins] = useState<ApiPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError("")
    Promise.all([fetchBuilds(), fetchPlugins()])
      .then(([b, p]) => {
        setBuilds(b)
        setPlugins(p)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load builds."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function handleSaved(build: ApiBuild) {
    setBuilds((prev) => {
      const idx = prev.findIndex((b) => b.id === build.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = build
        return updated
      }
      return [build, ...prev]
    })
  }

  async function handleDelete(id: string, label: string) {
    setDeletingId(id)
    try {
      await deleteBuild(id)
      setBuilds((prev) => prev.filter((b) => b.id !== id))
      toast.success(`Deleted build ${label}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete the build.")
    } finally {
      setDeletingId(null)
    }
  }

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
        title="Builds"
        description="Track official plugin builds and their verified SHA-256 hashes."
        action={
          <BuildDialog
            plugins={plugins}
            onSaved={handleSaved}
            trigger={
              <DialogTrigger render={<Button />}>
                <Plus className="size-4" />
                Add build
              </DialogTrigger>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>SHA-256 Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.plugin}</TableCell>
                    <TableCell className="font-mono text-sm">{b.version}</TableCell>
                    <TableCell className="max-w-[220px] truncate font-mono text-xs text-muted-foreground">
                      {b.hash}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={b.active ? "success" : "muted"}>
                        {b.active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                      {b.created}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <BuildDialog
                          build={b}
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
                          disabled={deletingId === b.id}
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(b.id, `${b.plugin} ${b.version}`)}
                        >
                          {deletingId === b.id ? <Loader2 className="size-4 animate-spin" /> : null}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {builds.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No builds registered.
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