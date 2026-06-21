"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import Image from "next/image"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createPlugin, updatePlugin, deletePlugin, ApiError, type ApiPlugin } from "@/lib/api"

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function PluginDialog({
  trigger,
  plugin,
  onSaved,
  onDelete,
}: {
  trigger: ReactNode
  plugin?: ApiPlugin
  onSaved?: (plugin: ApiPlugin) => void
  onDelete?: (plugin: ApiPlugin) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [active, setActive] = useState(true)
  const [legacy, setLegacy] = useState(false)
  const [requireHash, setRequireHash] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(plugin?.name ?? "")
      setDisplayName(plugin?.displayName ?? "")
      setDescription(plugin?.description ?? "")
      setImage(plugin?.image ?? null)
      setActive(plugin?.active ?? true)
      setLegacy(plugin?.mode === "legacy")
      setRequireHash(plugin?.requireHash ?? true)
    }
  }, [open, plugin])

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image is too large. Please use a file under ~1.5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.onerror = () => toast.error("Could not read that image file.")
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    // Validate fields
    if (!displayName.trim()) {
      toast.error("Display name is required.")
      return
    }
    if (!plugin && !name.trim()) {
      toast.error("Plugin name is required.")
      return
    }
    setSaving(true)
    try {
      if (plugin) {
        const updated = await updatePlugin(plugin.id, {
          displayName,
          description,
          image,
          mode: legacy ? "legacy" : "modern",
          active,
          requireHash,
        })
        toast.success("Plugin updated")
        onSaved?.(updated)
      } else {
        const created = await createPlugin({
          name,
          displayName,
          description,
          image,
          mode: legacy ? "legacy" : "modern",
          active,
          requireHash,
        })
        toast.success("Plugin created")
        onSaved?.(created)
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the plugin.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!plugin) return
    setDeleting(true)
    try {
      await deletePlugin(plugin.id)
      toast.success(`Deleted ${plugin.displayName}`)
      onDelete?.(plugin)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete the plugin.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plugin ? "Edit plugin" : "Add new plugin"}</DialogTitle>
          <DialogDescription>
            Configure the plugin metadata and validation behavior.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plugin-name">Plugin name</Label>
            <Input
              id="plugin-name"
              placeholder="auth-guard"
              value={name}
              disabled={!!plugin}
              onChange={(e) => setName(e.target.value)}
            />
            {plugin ? (
              <p className="text-xs text-muted-foreground">
                The machine name can&apos;t be changed after creation — it&apos;s what your Java plugin sends as <code>plugin</code>.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plugin-display">Display name</Label>
            <Input
              id="plugin-display"
              placeholder="AuthGuard"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plugin-desc">Description</Label>
            <Textarea
              id="plugin-desc"
              rows={3}
              placeholder="Short description of the plugin..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Plugin image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            {image ? (
              <div className="flex items-center gap-3">
                <Image
                  src={image}
                  alt="Plugin icon preview"
                  width={48}
                  height={48}
                  className="size-12 rounded-lg border border-border object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImage(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <Upload className="size-4" />
                Upload or change image
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <ToggleRow
              id="plugin-active"
              label="Active"
              description="Plugin is available for licensing."
              checked={active}
              onChange={setActive}
            />
            <ToggleRow
              id="plugin-legacy"
              label="Legacy mode"
              description="Use the legacy validation protocol."
              checked={legacy}
              onChange={setLegacy}
            />
            <ToggleRow
              id="plugin-hash"
              label="Require hash"
              description="Enforce JAR SHA-256 hash validation."
              checked={requireHash}
              onChange={setRequireHash}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {plugin && onDelete ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete plugin
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {plugin ? "Save changes" : "Create plugin"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}