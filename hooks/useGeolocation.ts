/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  speed: number | null
  heading: number | null
  error: string | null
  isTracking: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    error: null,
    isTracking: false
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Tarayıcınız konum özelliğini desteklemiyor'
      }))
      return
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 0
    } = options

    setState(prev => ({ ...prev, isTracking: true, error: null }))

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          error: null,
          isTracking: true
        })
      },
      (error) => {
        let errorMessage = 'Konum alınamadı'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi şu anda kullanılamıyor.'
            break
          case error.TIMEOUT:
            errorMessage = 'Konum isteği zaman aşımına uğradı.'
            break
          default:
            errorMessage = 'Bilinmeyen bir hata oluştu.'
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isTracking: false
        }))
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )

    setWatchId(id)
  }, [options])

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setState(prev => ({ ...prev, isTracking: false }))
  }, [watchId])

  const toggleTracking = useCallback(() => {
    if (state.isTracking) {
      stopTracking()
    } else {
      startTracking()
    }
  }, [state.isTracking, startTracking, stopTracking])

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    ...state,
    startTracking,
    stopTracking,
    toggleTracking
  }
}
