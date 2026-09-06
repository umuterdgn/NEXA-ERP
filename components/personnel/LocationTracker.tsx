/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState, useEffect } from "react"
import { MapPin, X } from "lucide-react"

export default function LocationTracker() {
  const [showModal, setShowModal] = useState(false)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // Check if user has given KVKK consent
    const consent = localStorage.getItem("locationConsent")
    
    if (!consent) {
      setShowModal(true)
    } else if (consent === "granted") {
      startTracking()
    }
  }, [])

  const handleConsent = () => {
    localStorage.setItem("locationConsent", "granted")
    setShowModal(false)
    startTracking()
  }

  const handleDecline = () => {
    localStorage.setItem("locationConsent", "declined")
    setShowModal(false)
  }

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const sendLocationToServer = async (position: GeolocationPosition) => {
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      })

      if (!response.ok) {
        console.error("Failed to send location:", await response.text())
      }
    } catch (error) {
      console.error("Error sending location:", error)
    }
  }

  const startTracking = () => {
    setIsTracking(true)

    // Get initial location immediately
    getCurrentLocation()
      .then(sendLocationToServer)
      .catch((error) => console.error("Error getting initial location:", error))

    // Set up interval to track location every 10 minutes (600000 ms)
    const intervalId = setInterval(() => {
      getCurrentLocation()
        .then(sendLocationToServer)
        .catch((error) => console.error("Error getting location:", error))
    }, 600000) // 10 minutes

    // Cleanup on unmount
    return () => clearInterval(intervalId)
  }

  if (!showModal) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Konum Takibi Onayı
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            İSG ve Şantiye Güvenliği gereği, mesai saatleriniz içerisinde konum bilginiz takip edilecektir.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">KVKK Aydınlatma Metni</h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Konum verileriniz sadece iş güvenliği amaçlı kullanılacaktır</li>
              <li>• Verileriniz 6 ay süreyle saklanacaktır</li>
              <li>• İstediğiniz zaman bu onayı geri çekebilirsiniz</li>
              <li>• Konum takibi sadece mesai saatlerinde (08:00 - 18:00) aktiftir</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Reddet
            </button>
            <button
              onClick={handleConsent}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
