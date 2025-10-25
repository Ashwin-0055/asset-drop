'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, Settings as SettingsIcon, User as UserIcon, Cloud, Unplug } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useGoogleDrive } from '@/hooks/useGoogleDrive'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

interface HeaderProps {
  onSearch?: (query: string) => void
  className?: string
}

export function Header({ onSearch, className }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const { user, signOut } = useAuth()
  const { isConnected, connectDrive, disconnectDrive, loading: driveLoading } = useGoogleDrive()
  const router = useRouter()

  // Handle Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('dashboard-search')
        searchInput?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleConnectDrive = async () => {
    const { error } = await connectDrive()
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect Google Drive. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDisconnectDrive = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive? Your uploaded files will remain in Drive, but you won\'t be able to upload new files until you reconnect.')) {
      return
    }

    const { error } = await disconnectDrive()
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Drive.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Google Drive disconnected successfully.',
      })
    }
  }

  const getUserInitials = () => {
    if (!user?.email) return 'U'
    return user.email
      .split('@')[0]
      .split('.')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-xl font-bold">AssetDrop</span>
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dashboard-search"
              type="text"
              placeholder="Search projects and files..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-9 pr-16 h-10"
            />
            <kbd
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 transition-opacity',
                searchFocused && 'opacity-0'
              )}
            >
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Google Drive Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Drive Connected' : 'Drive Disconnected'}
            </span>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
              <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Google Drive Connection */}
              {!isConnected ? (
                <DropdownMenuItem onClick={handleConnectDrive} disabled={driveLoading} className="cursor-pointer">
                  <Cloud className="mr-2 h-4 w-4" />
                  <span>{driveLoading ? 'Connecting...' : 'Connect Google Drive'}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleDisconnectDrive} disabled={driveLoading} className="cursor-pointer">
                  <Unplug className="mr-2 h-4 w-4" />
                  <span>Disconnect Google Drive</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
