import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useNotificationPolling } from './hooks/useNotificationPolling'
import Login from './pages/Login'
import VerifyOTP from './pages/VerifyOTP'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Chat from './pages/Chat'
import Gmail from './pages/Gmail'
import Tasks from './pages/Tasks'
import Voice from './pages/Voice'
import Settings from './pages/Settings'
import PrivateRoute from './components/PrivateRoute'
import Reminders from './pages/Reminders'  
import ProductivityStats from './pages/Productivitystats'

export default function App() {
    useNotificationPolling() 

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
                <Route path="/gmail" element={<Gmail />} />
                <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/productivity-stats" element={<PrivateRoute><ProductivityStats /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    )
}