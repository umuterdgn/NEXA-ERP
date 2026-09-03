"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, Wind, AlertTriangle } from "lucide-react"

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  isDay: number
}

interface WeatherWidgetProps {
  city?: string
}

export default function WeatherWidget({ city = "İskenderun" }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true)
      setError(false)
      
      try {
        // Open-Meteo API (no API key required)
        // First, geocode the city to get coordinates
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`
        )
        const geoData = await geoResponse.json()
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error("City not found")
        }
        
        const { latitude, longitude } = geoData.results[0]
        
        // Fetch weather data
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,is_day`
        )
        const weatherData = await weatherResponse.json()
        
        setWeather({
          temperature: weatherData.current.temperature_2m,
          weatherCode: weatherData.current.weather_code,
          windSpeed: weatherData.current.wind_speed_10m,
          isDay: weatherData.current.is_day
        })
      } catch (err) {
        console.error("Failed to fetch weather:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [city])

  const getWeatherIcon = (code: number, isDay: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-slate-400" />
    if (code >= 45 && code <= 48) return <Cloud className="w-5 h-5 text-slate-500" />
    if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />
    if (code >= 71 && code <= 77) return <Cloud className="w-5 h-5 text-slate-300" />
    if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />
    if (code >= 95) return <CloudRain className="w-5 h-5 text-purple-400" />
    return <Cloud className="w-5 h-5 text-slate-400" />
  }

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Açık"
    if (code >= 1 && code <= 3) return "Az Bulutlu"
    if (code >= 45 && code <= 48) return "Sisli"
    if (code >= 51 && code <= 67) return "Yağmurlu"
    if (code >= 71 && code <= 77) return "Karlı"
    if (code >= 80 && code <= 82) return "Sağanak"
    if (code >= 95) return "Fırtına"
    return "Bulutlu"
  }

  const hasWarning = weather && (weather.windSpeed > 15 || (weather.weatherCode >= 51 && weather.weatherCode <= 82))

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="animate-pulse w-10 h-10 bg-slate-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-3">
          <Cloud className="w-10 h-10 text-slate-500" />
          <div>
            <p className="text-white font-medium">{city}</p>
            <p className="text-slate-400 text-sm">Veri alınamadı</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 border ${hasWarning ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.weatherCode, weather.isDay)}
          <div>
            <p className="text-white font-medium">{city}</p>
            <p className="text-slate-400 text-sm">{getWeatherDescription(weather.weatherCode)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{Math.round(weather.temperature)}°C</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Wind className="w-4 h-4" />
          <span>{Math.round(weather.windSpeed)} km/s</span>
        </div>

        {hasWarning && (
          <div className="flex items-center gap-2 text-yellow-400 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Vinç/Beton Uyarısı</span>
          </div>
        )}
      </div>
    </div>
  )
}
