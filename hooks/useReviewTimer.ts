import { useState, useEffect, useCallback, useRef } from 'react'

const AUTO_SEND_DELAY_MINUTES = 5 // Configurable: how long to wait before auto-sending
const AUTO_SEND_DELAY_MS = AUTO_SEND_DELAY_MINUTES * 60 * 1000

interface UseReviewTimerOptions {
  onTimerExpire?: () => void
  enabled?: boolean
}

export function useReviewTimer({ onTimerExpire, enabled = true }: UseReviewTimerOptions = {}) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // milliseconds
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start or reset the timer
  const startTimer = useCallback(() => {
    if (!enabled) return

    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set initial time
    setTimeRemaining(AUTO_SEND_DELAY_MS)
    setIsActive(true)

    // Update countdown every second
    const startTime = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, AUTO_SEND_DELAY_MS - elapsed)

      setTimeRemaining(remaining)

      if (remaining === 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
      }
    }, 1000)

    // Set timeout for when timer expires
    timerRef.current = setTimeout(() => {
      setIsActive(false)
      onTimerExpire?.()
    }, AUTO_SEND_DELAY_MS)
  }, [enabled, onTimerExpire])

  // Reset timer (extends the session)
  const resetTimer = useCallback(() => {
    startTimer()
  }, [startTimer])

  // Stop timer completely
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsActive(false)
    setTimeRemaining(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Format time remaining as MM:SS
  const formatTimeRemaining = useCallback(() => {
    const totalSeconds = Math.ceil(timeRemaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [timeRemaining])

  // Get progress percentage (0-100)
  const getProgress = useCallback(() => {
    return ((AUTO_SEND_DELAY_MS - timeRemaining) / AUTO_SEND_DELAY_MS) * 100
  }, [timeRemaining])

  return {
    timeRemaining,
    isActive,
    startTimer,
    resetTimer,
    stopTimer,
    formatTimeRemaining,
    getProgress,
    delayMinutes: AUTO_SEND_DELAY_MINUTES,
  }
}
