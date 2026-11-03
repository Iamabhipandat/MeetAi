import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'
import CreateMeetingModal from './CreateMeetingModal'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="w-8 h-8 border-3 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-app-bg text-app-text font-['Outfit',sans-serif]">
      {/* Side navigation bar matching Huddle mockup */}
      <Sidebar onNewMeeting={() => setShowCreateModal(true)} />

      {/* Main scrollable viewport */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto custom-scroll">
        <div className="max-w-[1300px] mx-auto p-6 lg:p-8">
          <Outlet context={{ openCreateMeeting: () => setShowCreateModal(true) }} />
        </div>
      </main>

      {/* Global Quick Meeting Creation */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            // Trigger refresh event for children
            window.dispatchEvent(new CustomEvent('meetai:meeting-created'))
          }}
        />
      )}
    </div>
  )
}
