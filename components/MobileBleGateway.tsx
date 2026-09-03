/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useEffect, useState } from "react"

interface MobileBleGatewayProps {
  personelId: string
  enabled?: boolean
  interval?: number // seconds
}

export default function MobileBleGateway({ 
  personelId, 
  enabled = true, 
  interval = 30 
}: MobileBleGatewayProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [detectedBeacons, setDetectedBeacons] = useState<string[]>([])

  // Mock beacon scanning function
  // In React Native, this would use react-native-ble-plx or similar library
  const scanNearbyBeacons = async (): Promise<string[]> => {
    try {
      // TODO: Implement actual BLE scanning in React Native
      // For now, return empty array or mock data for testing
      const mockBeacons: string[] = []
      
      // Uncomment below for testing with mock data
      // mockBeacons.push("AA:BB:CC:DD:EE:FF")
      // mockBeacons.push("11:22:33:44:55:66")
      
      return mockBeacons
    } catch (error) {
      console.error("Beacon scan error:", error)
      return []
    }
  }

  // Get current GPS location
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  // Send location and detected beacons to server
  const sendLocationData = async (lat: number, lng: number, beacons: string[]) => {
    try {
      const response = await fetch("/api/location/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personelId,
          lat,
          lng,
          detectedEquipments: beacons
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Location tracking successful:", data)
      } else {
        console.error("Location tracking failed:", response.statusText)
      }
    } catch (error) {
      console.error("Error sending location data:", error)
    }
  }

  // Main tracking loop
  useEffect(() => {
    if (!enabled || !personelId) return

    setIsTracking(true)

    const trackLocation = async () => {
      try {
        // Get current GPS location
        const location = await getCurrentLocation()
        setLastLocation(location)

        // Scan for nearby beacons
        const beacons = await scanNearbyBeacons()
        setDetectedBeacons(beacons)

        // Send data to server
        await sendLocationData(location.lat, location.lng, beacons)
      } catch (error) {
        console.error("Location tracking error:", error)
      }
    }

    // Initial tracking
    trackLocation()

    // Set up interval
    const intervalId = setInterval(trackLocation, interval * 1000)

    return () => {
      clearInterval(intervalId)
      setIsTracking(false)
    }
  }, [enabled, personelId, interval])

  // This component runs silently in the background
  // It doesn't render anything visible
  return null
}
