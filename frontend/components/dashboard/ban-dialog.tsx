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
import { createBan, updateBan, ApiError, type ApiBan, type ApiPlugin } from "@/lib/api"

export function BanDialog({
  trigger,
  ban,
  plugins,
  onSaved,
}: {
  trigger: ReactNode
  ban?: ApiBan
  plugins: ApiPlugin[]
  onSaved?: (ban: ApiBan) => void
}) {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState("global")
  const [identifier, setIdentifier] = useState("")
  const [reason, setReason] = useState("")
  const [permanent, setPermanent] = useState(true)
  const [duration, setDuration] = useState("30 days")
  const [until, setUntil] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setProductId(ban?.productId ?? "global")
      setIdentifier(ban?.identifier ?? "")
      setReason(ban?.reason ?? "")
      setPermanent(ban ? ban.until === null : true)
      setDuration("30 days")
      setUntil(ban?.until ?? "")
      setActive(ban ? ban.status === "active" : true)
    }
  }, [open, ban])

  async function handleSave() {
    if (!identifier.trim()) {
      toast.error("IP or domain is required.")
      return
    }
    setSaving(true)
    try {
      if (ban) {
        const updated = await updateBan(ban.id, {
          reason,
          permanent,
          duration: !permanent && duration !== "custom" ? duration : undefined,
          until: !permanent && duration === "custom" ? until : undefined,
          active,
        })
        toast.success("Server ban updated")
        onSaved?.(updated)
      } else {
        const created = await createBan({
          productId: productId === "global" ? null : productId,
          identifier: identifier.trim(),
          reason,
          permanent,
          duration: !permanent && duration !== "custom" ? duration : undefined,
          until: !permanent && duration === "custom" ? until : undefined,
        })
        toast.success("Server ban created")
        onSaved?.(created)
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the ban.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ban ? "Edit server ban" : "Add server ban"}</DialogTitle>
          <DialogDescription>
            Block a server by IP or domain, globally or per plugin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Plugin (optional)</Label>
            <Select
              value={productId}
              onValueChange={setProductId}
              disabled={!!ban}
            >
              <SelectTrigger>
                <SelectValue placeholder="Global ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (all plugins)</SelectItem>
                {plugins.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ban-id">IP / domain</Label>
            <Input
              id="ban-id"
              placeholder="198.51.100.42 or cracked.example.net"
              value={identifier}
              disabled={!!ban}
              onChange={(e) => setIdentifier(e.target.value)}
              className="font-mono text-sm"
            />
            {ban ? (
              <p className="text-xs text-muted-foreground">
                The banned identifier can&apos;t be changed — create a new ban instead.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Textarea
              id="ban-reason"
              rows={2}
              placeholder="Reason for the ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="ban-permanent" className="text-sm">
                Permanent
              </Label>
              <p className="text-xs text-muted-foreground">Ban never expires.</p>
            </div>
            <Switch
              id="ban-permanent"
              checked={permanent}
              onCheckedChange={setPermanent}
            />
          </div>

          {!permanent ? (
            <div className="flex flex-col gap-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 day">1 day</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="90 days">90 days</SelectItem>
                  <SelectItem value="6 months">6 months</SelectItem>
                  <SelectItem value="1 year">1 year</SelectItem>
                  <SelectItem value="custom">Custom date</SelectItem>
                </SelectContent>
              </Select>
              {duration === "custom" ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Label htmlFor="ban-until">Expires on</Label>
                  <Input
                    id="ban-until"
                    type="date"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ban will automatically expire {duration} after it is created.
                </p>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <Label htmlFor="ban-active" className="text-sm">
              Active
            </Label>
            <Switch
              id="ban-active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {ban ? "Save changes" : "Create ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}