"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Copy, ExternalLink, Calendar, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import QRCode from 'qrcode'

interface LinkTabProps {
  project: Project
  onUpdate: () => void
}

export function LinkTab({ project, onUpdate }: LinkTabProps) {
  const supabase = createClient()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [password, setPassword] = useState(project.link_password || '')
  const [expiry, setExpiry] = useState(
    project.link_expiry ? new Date(project.link_expiry).toISOString().split('T')[0] : ''
  )
  const [disabled, setDisabled] = useState(project.link_disabled)
  const [hasPassword, setHasPassword] = useState(!!project.link_password)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingExpiry, setSavingExpiry] = useState(false)
  const [clearingExpiry, setClearingExpiry] = useState(false)

  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/collect/${project.shareable_link_id}`

  useEffect(() => {
    generateQRCode()
  }, [shareLink])

  async function generateQRCode() {
    try {
      const url = await QRCode.toDataURL(shareLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
    })
  }

  function openLink() {
    window.open(shareLink, '_blank')
  }

  async function updatePassword() {
    setSavingPassword(true)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          link_password: hasPassword ? password || null : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: hasPassword ? 'link_password_enabled' : 'link_password_disabled',
      })

      onUpdate()
      toast({
        title: 'Success',
        description: hasPassword ? 'Password protection enabled' : 'Password protection disabled',
      })
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  async function updateExpiry(clearExpiry = false) {
    if (clearExpiry) {
      setClearingExpiry(true)
    } else {
      setSavingExpiry(true)
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          link_expiry: expiry ? new Date(expiry).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: 'link_expiry_updated',
        action_details: { expiry_date: expiry },
      })

      onUpdate()
      toast({
        title: 'Success',
        description: clearExpiry ? 'Expiration date cleared' : 'Expiration date updated',
      })
    } catch (error) {
      console.error('Error updating expiry:', error)
      toast({
        title: 'Error',
        description: 'Failed to update expiration date',
        variant: 'destructive',
      })
    } finally {
      if (clearExpiry) {
        setClearingExpiry(false)
      } else {
        setSavingExpiry(false)
      }
    }
  }

  async function toggleDisabled(value: boolean) {
    setDisabled(value)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          link_disabled: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        project_id: project.id,
        action_type: value ? 'link_disabled' : 'link_enabled',
      })

      onUpdate()
      toast({
        title: 'Success',
        description: value ? 'Link disabled' : 'Link enabled',
      })
    } catch (error) {
      console.error('Error toggling link:', error)
      setDisabled(!value)
      toast({
        title: 'Error',
        description: 'Failed to update link status',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Link Display */}
      <Card>
        <CardHeader>
          <CardTitle>Share Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={openLink} variant="outline">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {disabled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">This link is currently disabled</p>
              <p className="text-red-600 text-sm mt-1">
                Enable it below to allow clients to submit files
              </p>
            </div>
          )}

          {project.link_expiry && new Date(project.link_expiry) < new Date() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">This link has expired</p>
              <p className="text-yellow-600 text-sm mt-1">
                Update the expiration date below to reactivate it
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            {qrCodeUrl && (
              <>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = qrCodeUrl
                    link.download = `${project.name}-qr-code.png`
                    link.click()
                  }}
                >
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Link Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Disable Link */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="disabled">Disable Link</Label>
              <p className="text-sm text-gray-500">
                Prevent clients from accessing this link
              </p>
            </div>
            <Switch
              id="disabled"
              checked={disabled}
              onCheckedChange={toggleDisabled}
            />
          </div>

          {/* Password Protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="password-protection">Password Protection</Label>
                <p className="text-sm text-gray-500">
                  Require a password to access this link
                </p>
              </div>
              <Switch
                id="password-protection"
                checked={hasPassword}
                onCheckedChange={setHasPassword}
              />
            </div>

            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={savingPassword}
                  />
                  <Button onClick={updatePassword} disabled={savingPassword}>
                    {savingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiration Date</Label>
            <p className="text-sm text-gray-500">
              Link will become inactive after this date
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="expiry"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  disabled={savingExpiry || clearingExpiry}
                />
              </div>
              <Button onClick={() => updateExpiry(false)} disabled={savingExpiry || clearingExpiry}>
                {savingExpiry ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
              {expiry && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpiry('')
                    updateExpiry(true)
                  }}
                  disabled={savingExpiry || clearingExpiry}
                >
                  {clearingExpiry ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    'Clear'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
