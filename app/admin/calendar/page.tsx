"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [siteReports, setSiteReports] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedDayData, setSelectedDayData] = useState<{ date: Date; reports: any[]; events: any[]; activePersonnel: any[] } | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchSiteReports()
    fetchPersonnel()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/admin/calendar")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSiteReports = async () => {
    try {
      const response = await fetch("/api/admin/site-reports")
      if (response.ok) {
        const data = await response.json()
        setSiteReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch site reports:", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday
    
    return { daysInMonth, startDayOfWeek }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getSiteReportsForDate = (date: Date) => {
    return siteReports.filter(report => {
      const reportDate = new Date(report.date)
      return reportDate.toDateString() === date.toDateString()
    })
  }

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayReports = getSiteReportsForDate(date)
    const dayEvents = getEventsForDate(date)
    
    // Get active personnel (all personnel for now, could be filtered by attendance)
    const activePersonnel = personnel.filter(p => p.status !== 'RETIRED')
    
    setSelectedDayData({
      date,
      reports: dayReports,
      events: dayEvents,
      activePersonnel
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "project": return "Proje"
      case "maintenance": return "Bakım"
      case "salary": return "Maaş"
      case "sgk": return "SGK"
      default: return type
    }
  }

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentDate)
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Takvim
        </h1>
      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevMonth}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            →
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {/* Empty cells before first day */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-slate-800/50 rounded-lg"></div>
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const dayEvents = getEventsForDate(date)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`h-24 bg-slate-800 rounded-lg p-2 overflow-hidden hover:bg-slate-700 transition-colors cursor-pointer ${
                    isToday ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="text-sm text-slate-300 mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(event)
                        }}
                        className="text-xs truncate p-1 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color + "20", color: event.color }}
                      >
                        {event.title}
                    </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500">
                        +{dayEvents.length - 2} daha
                      </div>
                    )}
                  </div>
                </div>
              )
          })}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">
                {selectedEvent.title}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-slate-400">Tarih:</span>
                <div className="text-white">
                  {new Date(selectedEvent.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
              </div>

              <div>
                <span className="text-sm text-slate-400">Tip:</span>
                <div
                  className="inline-block px-2 py-1 rounded text-sm mt-1"
                  style={{ backgroundColor: selectedEvent.color + "30", color: selectedEvent.color }}
                >
                  {getEventTypeLabel(selectedEvent.type)}
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <span className="text-sm text-slate-400">Açıklama:</span>
                  <div className="text-white mt-1">{selectedEvent.description}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDayData && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedDayData(null)}
        >
          <div
            className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedDayData.date.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedDayData.date.toLocaleDateString("tr-TR", { weekday: "long" })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayData(null)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Site Reports */}
              <div>
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Şantiye Günlükleri
                </h4>
                {selectedDayData.reports.length === 0 ? (
                  <div className="bg-slate-800 rounded-lg p-4 text-center text-slate-400">
                    Bu gün için şantiye günlüğü yok
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayData.reports.map((report) => (
                      <div key={report.id} className="bg-slate-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">
                            {report.project?.name || report.project?.title || "Proje"}
                          </span>
                          {report.weather && (
                            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs">
                              {report.weather}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{report.notes}</p>
                        {report.workerCount && (
                          <p className="text-xs text-slate-500 mt-2">
                            Çalışan: {report.workerCount} kişi
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events */}
              <div>
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Etkinlikler ({selectedDayData.events.length})
                </h4>
                {selectedDayData.events.length === 0 ? (
                  <div className="bg-slate-800 rounded-lg p-4 text-center text-slate-400">
                    Bu gün için etkinlik yok
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayData.events.map((event) => (
                      <div key={event.id} className="bg-slate-800 rounded-lg p-4 border-l-4" style={{ borderLeftColor: event.color }}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">{event.title}</span>
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: event.color + "30", color: event.color }}
                          >
                            {getEventTypeLabel(event.type)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-300 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Personnel */}
              <div>
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Aktif Personel ({selectedDayData.activePersonnel.length})
                </h4>
                {selectedDayData.activePersonnel.length === 0 ? (
                  <div className="bg-slate-800 rounded-lg p-4 text-center text-slate-400">
                    Aktif personel yok
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDayData.activePersonnel.slice(0, 10).map((person) => (
                        <div key={person.id} className="text-sm text-slate-300">
                          {person.name}
                        </div>
                      ))}
                      {selectedDayData.activePersonnel.length > 10 && (
                        <div className="text-sm text-slate-500 col-span-2">
                          +{selectedDayData.activePersonnel.length - 10} daha
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedDayData(null)}
              className="w-full mt-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
