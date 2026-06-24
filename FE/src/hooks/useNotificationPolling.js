import { useEffect, useRef } from 'react'
import { getPendingNotifications, markNotificationSent } from '../services/notificationService'

// Dùng hook này trong App.jsx hoặc layout chính để chạy ngầm toàn app
export function useNotificationPolling(intervalMs = 60000) {
    const permissionRef = useRef(false)

    useEffect(() => {
        // Xin quyền browser notification
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
                permissionRef.current = perm === 'granted'
            })
        } else {
            permissionRef.current = Notification.permission === 'granted'
        }

        const check = async () => {
            try {
                const pending = await getPendingNotifications()
                for (const notif of pending) {
                    // Hiện browser notification
                    if (permissionRef.current) {
                        const n = new Notification(notif.title, {
                            body: notif.body ?? '',
                            icon: '/favicon.svg',
                        })
                        // Click vào notification → focus tab
                        n.onclick = () => window.focus()
                    }
                    // Đánh dấu đã gửi để không hiện lại
                    await markNotificationSent(notif.id)
                }
            } catch (e) {
                // Bỏ qua lỗi (user chưa login, mất mạng...)
            }
        }

        // Chạy ngay lần đầu rồi định kỳ
        check()
        const timer = setInterval(check, intervalMs)
        return () => clearInterval(timer)
    }, [intervalMs])
}