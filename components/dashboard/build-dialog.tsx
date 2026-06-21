"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createBuild, updateBuild, ApiError, type ApiBuild, type ApiPlugin } from "@/lib/api"

export function BuildDialog({
  trigger,
  build,
  plugins,
  onSaved,
}: {
  trigger: ReactNode
  build?: ApiBuild
  plugins: ApiPlugin[]
  onSaved?: (build: ApiBuild) => void
}) {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState("")
  const [hash, setHash] = useState("")
  const [version, setVersion] = useState("")
  const [active, setActive] = useState(true)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setProductId(build?.productId ?? "")
      setHash(build?.hash ?? "")
      setVersion(build?.version ?? "")
      setActive(build?.active ?? true)
      setReason(build?.reason ?? "")
    }
  }, [open, build])

  async function handleSave() {
    if (!build && !productId) {
      toast.error("Select a plugin.")
      return
    }
    if (!build && !/^[0-9a-fA-F]{64}$/.test(hash.trim())) {
      toast.error("Hash must be a 64-character SHA-256 hex string.")
      return
    }
    setSaving(true)
    try {
      if (build) {
        const updated = await updateBuild(build.id, {
          version,
          active,
          reason,
        })
        toast.success("Build updated")
        onSaved?.(updated)
      } else {
        const created = await createBuild({
          productId,
          hash: hash.trim().toLowerCase(),
          version,
          active,
          reason,
        })
        toast.success("Build registered")
        onSaved?.(created)
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the build.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{build ? "Edit build" : "Add build"}</DialogTitle>
          <DialogDescription>
            Register an official plugin build and its verified hash.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Plugin</Label>
            <Select
              value={productId}
              onValueChange={setProductId}
              disabled={!!build}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plugin" />
              </SelectTrigger>
              <SelectContent>
                {plugins.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="build-hash">JAR SHA-256 hash</Label>
            <Input
              id="build-hash"
              placeholder="a3f5c9e2b1d4..."
              value={hash}
              disabled={!!build}
              onChange={(e) => setHash(e.target.value)}
              className="font-mono text-xs"
            />
            {build ? (
              <p className="text-xs text-muted-foreground">
                The hash can&apos;t be changed after creation — register a new build instead.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="build-version">Version</Label>
            <Input
              id="build-version"
              placeholder="3.4.1"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <Label htmlFor="build-active" className="text-sm">
              Active
            </Label>
            <Switch
              id="build-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="build-reason">Reason (optional)</Label>
            <Textarea
              id="build-reason"
              rows={2}
              placeholder="Release notes or rationale..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {build ? "Save changes" : "Register build"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}