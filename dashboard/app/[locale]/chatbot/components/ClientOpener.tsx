'use client'
import { useEffect } from 'react'

export default function ClientOpener(){
  useEffect(() => {
    try {
      // open docked assistant when this page is visited
      window.dispatchEvent(new Event('chatbot:openDock'))
    } catch (e) {}
  }, [])

  return (
    <div className="py-8">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-lg font-semibold">Assistant opened in dock</h2>
        <p className="text-sm text-gray-500">The assistant is visible on the right as a docked panel. Close this page or use the header toggle to manage it.</p>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-sky-600 text-white rounded"
            onClick={() => window.dispatchEvent(new Event('chatbot:openDock'))}
          >Open assistant</button>
        </div>
      </div>
    </div>
  )
}
