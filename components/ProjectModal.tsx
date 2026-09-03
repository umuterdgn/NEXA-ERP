"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface ProjectModalProps {
  project: {
    id: string
    title: string
    description: string
    images: string[]
  }
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % project.images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + project.images.length) % project.images.length)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
        >
          <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-3xl font-bold text-white">{project.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Image Slider */}
            {project.images.length > 0 && (
              <div className="relative mb-8 aspect-video bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={project.images[currentIndex]}
                  alt={`${project.title} - Görsel ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {project.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/70 to-transparent hover:from-black/90 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-l from-black/70 to-transparent hover:from-black/90 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      {project.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}