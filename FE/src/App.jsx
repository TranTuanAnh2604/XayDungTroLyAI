import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Chat from './pages/Chat'
import Email from './pages/Email'
import Tasks from './pages/Tasks'
import Voice from './pages/Voice'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/email" element={<Email />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/voice" element={<Voice />} />
            </Routes>
        </BrowserRouter>
    )
}