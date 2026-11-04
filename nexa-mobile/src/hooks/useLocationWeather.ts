import { useState, useCallback } from "react";
import * as Location from "expo-location";

/**
 * Open-Meteo WMO Hava Durumu Kodları Çeviricisi
 */
export const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Açık / Güneşli";
  if (code === 1 || code === 2) return "Az Bulutlu";
  if (code === 3) return "Parçalı Bulutlu / Kapalı";
  if (code >= 45 && code <= 48) return "Sisli";
  if (code >= 51 && code <= 55) return "Çiseleyen Yağmur";
  if (code >= 61 && code <= 65) return "Yağmurlu";
  if (code >= 71 && code <= 77) return "Karlı";
  if (code >= 80 && code <= 82) return "Sağanak Yağış";
  if (code >= 95) return "Gök Gürültülü Fırtına";
  return "Normal";
};

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  time?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  mocked: boolean;
  timestamp: number;
}

export interface LocationWeatherResult {
  location: LocationData;
  weather: WeatherData;
}

/**
 * Nexa ERP - Anti-Fake GPS & Otomatik Hava Durumu Hook'u
 * expo-location isMocked kontrolü ile sahte GPS tespiti ve Open-Meteo entegrasyonu
 */
export function useLocationWeather() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LocationWeatherResult | null>(null);
  const [isMocked, setIsMocked] = useState<boolean>(false);

  const fetchLocationAndWeather = useCallback(async (): Promise<LocationWeatherResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Konum İzni Kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const permErr = "Konum izni verilmedi. Şantiye jurnali için konum zorunludur.";
        setError(permErr);
        throw new Error(permErr);
      }

      // 2. GPS Verisini Çek
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.High,
      });

      // 3. GÜVENLİK KİLİDİ: Anti-Fake GPS / Mock Location Tespiti (isMocked)
      const hasFakeGps =
        Boolean(location.mocked) ||
        Boolean((location.coords as any)?.isMocked) ||
        Boolean((location.coords as any)?.mocked) ||
        Boolean((location as any)?.isFromMockProvider);

      setIsMocked(hasFakeGps);

      const { latitude, longitude, altitude, accuracy } = location.coords;

      const locationResult: LocationData = {
        latitude,
        longitude,
        altitude,
        accuracy,
        mocked: hasFakeGps,
        timestamp: location.timestamp,
      };

      // 4. Open-Meteo API Entegrasyonu
      let weatherResult: WeatherData = {
        temperature: 19,
        windSpeed: 12,
        weatherCode: 0,
        description: "Açık / Güneşli",
        isDay: true,
      };

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const response = await fetch(weatherUrl);
        if (response.ok) {
          const weatherJson = await response.json();
          const current = weatherJson.current_weather;
          weatherResult = {
            temperature: current?.temperature ?? 19,
            windSpeed: current?.windspeed ?? 12,
            weatherCode: current?.weathercode ?? 0,
            description: getWeatherDescription(current?.weathercode ?? 0),
            isDay: current?.is_day === 1,
            time: current?.time,
          };
        }
      } catch (weatherErr) {
        console.warn("[useLocationWeather] Hava durumu servisi uyarısı:", weatherErr);
      }

      const finalResult: LocationWeatherResult = {
        location: locationResult,
        weather: weatherResult,
      };

      setData(finalResult);
      return finalResult;
    } catch (err: any) {
      const msg = err.message || "Konum ve hava durumu alınamadı.";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    location: data?.location ?? null,
    weather: data?.weather ?? null,
    isMocked,
    fetchLocationAndWeather,
  };
}

export default useLocationWeather;
