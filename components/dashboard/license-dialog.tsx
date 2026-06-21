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
import { createLicense, updateLicense, ApiError, type ApiLicense, type ApiPlugin } from "@/lib/api"

const DURATIONS = ["30 days", "3 months", "6 months", "1 year", "Lifetime"]

export function LicenseDialog({
  trigger,
  license,
  plugins,
  onSaved,
}: {
  trigger: ReactNode
  license?: ApiLicense
  plugins: ApiPlugin[]
  onSaved?: (license: ApiLicense) => void
}) {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState("")
  const [label, setLabel] = useState("")
  const [key, setKey] = useState("")
  const [duration, setDuration] = useState("Lifetime")
  const [active, setActive] = useState(true)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setProductId(license?.productId ?? "")
      setLabel(license?.label ?? "")
      setKey(license?.key ?? "")
      setDuration(license?.duration ?? "Lifetime")
      setActive(license ? license.status === "active" : true)
      setNotes(license?.notes ?? "")
    }
  }, [open, license])

  async function handleSave() {
    if (!license && !productId) {
      toast.error("Select a plugin.")
      return
    }
    setSaving(true)
    try {
      if (license) {
        const updated = await updateLicense(license.id, {
          label,
          duration,
          active,
          notes,
        })
        toast.success("License updated")
        onSaved?.(updated)
      } else {
        const created = await createLicense({
          productId,
          key: key.trim() || undefined,
          label,
          duration,
          active,
          notes,
        })
        toast.success("License created")
        onSaved?.(created)
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the license.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{license ? "Edit global license" : "Add global license"}</DialogTitle>
          <DialogDescription>
            Plugins are free — a global key secures a specific plugin for a fixed
            duration. The same key is shared across every server running it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Plugin</Label>
            <Select
              value={productId}
              onValueChange={setProductId}
              disabled={!!license}
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
            {license ? (
              <p className="text-xs text-muted-foreground">
                A license&apos;s plugin can&apos;t be changed after creation.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lic-label">Label</Label>
            <Input
              id="lic-label"
              placeholder="Public Global Key"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="lic-key">Global license key</Label>
            <Input
              id="lic-key"
              placeholder="Leave blank to auto-generate"
              value={key}
              disabled={!!license}
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
            />
            {license ? (
              <p className="text-xs text-muted-foreground">
                The key itself can&apos;t be changed after creation — create a new
                license instead.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Expiry is calculated automatically from the duration. Choose
              Lifetime for a key that never expires.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3 sm:col-span-2">
            <Label htmlFor="lic-active" className="text-sm">
              Active
            </Label>
            <Switch
              id="lic-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="lic-notes">Notes (optional)</Label>
            <Textarea
              id="lic-notes"
              rows={2}
              placeholder="Notes about this license..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {license ? "Save changes" : "Create license"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}