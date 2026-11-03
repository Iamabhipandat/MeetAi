import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/AppLayout'
import DashboardPage from './pages/DashboardPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import SearchPage from './pages/SearchPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RoomPage from './pages/RoomPage'
import JoinPage from './pages/JoinPage'
import NotesPage from './pages/NotesPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Quick Guest Join Route */}
            <Route path="/join/:code" element={<JoinPage />} />

            {/* Live Video Conference Room with AI Q&A Sidebar */}
            <Route path="/room/:code" element={<RoomPage />} />

            {/* Direct Google Meet Interface (No login wall) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/meetings/:id" element={<MeetingDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/notes" element={<NotesPage />} />
            </Route>

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
