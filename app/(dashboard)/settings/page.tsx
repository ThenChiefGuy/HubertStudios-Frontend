"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ShieldCheck, AlertCircle, Mail, Fingerprint, Lock, CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { fetchSettings, updateSettings, fetchPlugins, ApiError, type ApiPlugin } from "@/lib/api"

export default function SettingsPage() {
  const [globalHash, setGlobalHash] = useState(true)
  const [emailProvider, setEmailProvider] = useState<string | null>(null)
  const [emailFrom, setEmailFrom] = useState<string | null>(null)
  const [allowed, setAllowed] = useState<string[]>([])
  const [legacy, setLegacy] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [settings, plugins] = await Promise.all([fetchSettings(), fetchPlugins()])
      setGlobalHash(settings.globalRequireHash)
      setEmailProvider(settings.emailProvider)
      setEmailFrom(settings.emailFrom)
      // derive allowed and legacy product identifiers from plugin list
      const allowedList = plugins.filter((p) => p.active && p.mode === "modern").map((p) => p.name)
      const legacyList = plugins.filter((p) => p.mode === "legacy").map((p) => p.name)
      setAllowed(allowedList)
      setLegacy(legacyList)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load settings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleGlobalHash(value: boolean) {
    setSaving(true)
    try {
      await updateSettings({ globalRequireHash: value })
      setGlobalHash(value)
      toast.success(value ? "Global hash enabled" : "Global hash disabled")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update global hash setting.")
    } finally {
      setSaving(false)
    }
  }

  const securityItems = [
    { label: "Two-factor email verification", ok: true },
    { label: "Cloudflare Turnstile", ok: true },
    { label: "Hash validation enforcement", ok: globalHash },
    { label: "Audit logging", ok: true },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        {/* fallback spinner using CSS-only since no icon imported here */}
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
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
        title="Settings"
        description="Configure global validation, products, and security."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allowed products</CardTitle>
            <CardDescription>
              Derived from your active, modern plugins. Manage this via the Plugins tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              rows={Math.max(3, allowed.length + 1)}
              className="font-mono text-sm"
              value={allowed.join("\n")}
              readOnly
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legacy products</CardTitle>
            <CardDescription>
              Plugins using the legacy validation protocol. Manage this via the Plugins tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              rows={Math.max(3, legacy.length + 1)}
              className="font-mono text-sm"
              value={legacy.join("\n")}
              readOnly
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="size-4 text-primary" />
              Global hash validation
            </CardTitle>
            <CardDescription>
              Enforce SHA-256 JAR validation across all plugins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <Label htmlFor="global-hash" className="text-sm">
                Require hash for all plugins
              </Label>
              <Switch
                id="global-hash"
                checked={globalHash}
                onCheckedChange={toggleGlobalHash}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-primary" />
              Email settings
            </CardTitle>
            <CardDescription>Transactional email configuration.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">{emailProvider ?? "Unknown"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From address</span>
              <span className="font-mono text-xs">{emailFrom ?? "Not set"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Verification codes</span>
              <StatusBadge tone="success">Enabled</StatusBadge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="size-4 text-primary" />
              Security status
            </CardTitle>
            <CardDescription>
              Current protection layers for the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {securityItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                  <span className="text-sm text-foreground">{item.label}</span>
                  <StatusBadge tone={item.ok ? "success" : "danger"} className="ml-auto">
                    {item.ok ? "Active" : "Inactive"}
                  </StatusBadge>
                </div>
              ))}
            </div>
            {securityItems.every((i) => i.ok) ? (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                <ShieldCheck className="size-4" />
                All security layers are operational.
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                <AlertCircle className="size-4" />
                One or more security layers are inactive.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
