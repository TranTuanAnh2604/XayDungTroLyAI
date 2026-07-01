import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getWeeklyStats } from '../services/statsService'

const RING_COLORS = ['#8455ef', '#565e74', '#6b38d4', '#45464d']

export default function ProductivityStats() {
    const chartRef = useRef(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getWeeklyStats()
                if (isMounted) setStats(data)
            } catch (e) {
                console.error('Không tải được thống kê tuần', e)
                if (isMounted) setError('Không tải được dữ liệu thống kê.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        if (!stats) return

        // Animate progress rings
        const circles = document.querySelectorAll('.progress-ring-circle')
        circles.forEach((circle) => {
            const dashArray = circle.getAttribute('data-dasharray')
            circle.style.strokeDasharray = '0, 100'
            setTimeout(() => {
                circle.style.strokeDasharray = dashArray
            }, 300)
        })

        // Animate bar charts
        const bars = document.querySelectorAll('.chart-bar-transition')
        bars.forEach((bar) => {
            const height = bar.getAttribute('data-height')
            bar.style.height = '0%'
            setTimeout(() => {
                bar.style.height = height
            }, 500)
        })
    }, [stats])

    const categories = stats?.categories || []
    const primaryColor = categories[0]?.color || '#6b38d4'
    const secondaryColor = categories[1]?.color || '#cbdbf5'
    const primaryLabel = categories[0]?.name || 'Chưa có dữ liệu'
    const secondaryLabel = categories[1]?.name || null

    const days = stats?.days || []
    const goals = stats?.goals || []
    const overallRate = stats?.overallCompletionRate ?? 0

    const overallLabel =
        overallRate >= 80 ? 'Tuyệt vời!' : overallRate >= 50 ? 'Khá tốt' : overallRate > 0 ? 'Cần cố gắng hơn' : 'Chưa có dữ liệu'

    return (
        <div className="overflow-x-hidden bg-[#f8f9ff] min-h-screen text-[#0b1c30]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Sidebar thực tế của dự án */}
            <Sidebar />

            {/* Main Content */}
            <main className="ml-[280px] pt-16 min-h-screen w-[calc(100%-280px)] bg-[#f8f9ff]">
                <div className="w-full max-w-[1920px] mx-auto p-[24px]">
                    {/* Page Header */}
                    <div className="mb-[40px] flex justify-between items-end">
                        <div>
                            <h2 className="text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold mb-[4px]">
                                Báo cáo &amp; Phân tích năng suất
                            </h2>
                            <p className="text-[16px] leading-[1.5] text-[#45464d]">
                                {days.length
                                    ? `Dữ liệu tuần từ ${new Date(days[0].date).toLocaleDateString('vi-VN')} đến ${new Date(days[days.length - 1].date).toLocaleDateString('vi-VN')}`
                                    : 'Dữ liệu tổng hợp tuần này'}
                            </p>
                        </div>
                        <div className="flex gap-[16px]">
                            <button className="px-[16px] py-[8px] bg-white/70 backdrop-blur-md border border-[#e2e8f0] rounded-lg text-[14px] font-medium flex items-center gap-[8px] hover:bg-[#dce9ff] transition-colors">
                                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                7 ngày qua
                            </button>
                            <button className="px-[16px] py-[8px] bg-black text-white rounded-lg text-[14px] font-medium flex items-center gap-[8px] hover:opacity-90 active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-[20px]">download</span>
                                Xuất báo cáo
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-[24px] p-[16px] bg-[#ffdad6] text-[#93000a] rounded-lg text-[14px]">
                            {error}
                        </div>
                    )}

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-12 gap-[24px]">
                        {/* Section 1: Weekly Time Statistics */}
                        <div className="col-span-12 bg-white/70 backdrop-blur-md border border-[#e2e8f0] p-[24px] rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-[40px]">
                                <h3 className="text-[24px] leading-[1.3] font-semibold">
                                    Thống kê thời gian tuần này
                                </h3>
                                <div className="flex items-center gap-[16px]">
                                    <span className="flex items-center gap-[4px] text-[14px] font-medium">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                                        {primaryLabel}
                                    </span>
                                    {secondaryLabel && (
                                        <span className="flex items-center gap-[4px] text-[14px] font-medium">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: secondaryColor }}></span>
                                            {secondaryLabel}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {loading ? (
                                <div className="h-[320px] flex items-center justify-center text-[#76777d] text-[14px]">
                                    Đang tải dữ liệu...
                                </div>
                            ) : days.length === 0 ? (
                                <div className="h-[320px] flex items-center justify-center text-[#76777d] text-[14px]">
                                    Chưa có dữ liệu time tracking cho tuần này
                                </div>
                            ) : (
                                <div ref={chartRef} className="h-[320px] flex items-end justify-between px-[16px] gap-4">
                                    {days.map((item) => (
                                        <div key={item.label + item.date} className="flex-1 flex flex-col items-center gap-[8px] group">
                                            <div className="w-full flex items-end justify-center gap-1 h-full">
                                                <div
                                                    className="w-4 rounded-t-sm chart-bar-transition hover:opacity-80"
                                                    style={{ backgroundColor: primaryColor, height: `${item.primaryPercent}%`, transition: 'height 1s ease-out' }}
                                                    data-height={`${item.primaryPercent}%`}
                                                    title={`${item.primaryMinutes} phút`}
                                                ></div>
                                                {secondaryLabel && (
                                                    <div
                                                        className="w-4 rounded-t-sm chart-bar-transition hover:opacity-80"
                                                        style={{ backgroundColor: secondaryColor, height: `${item.secondaryPercent}%`, transition: 'height 1s ease-out' }}
                                                        data-height={`${item.secondaryPercent}%`}
                                                        title={`${item.secondaryMinutes} phút`}
                                                    ></div>
                                                )}
                                            </div>
                                            <span className="text-[14px] font-medium text-[#45464d]">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Personal Goal Achievement */}
                        <div className="col-span-12 flex flex-col gap-[24px]">
                            <div className="bg-white/70 backdrop-blur-md border border-[#e2e8f0] p-[24px] rounded-xl shadow-sm flex-1">
                                <h3 className="text-[24px] leading-[1.3] font-semibold mb-[24px]">Mục tiêu cá nhân</h3>

                                {loading ? (
                                    <p className="text-[14px] text-[#76777d]">Đang tải dữ liệu...</p>
                                ) : goals.length === 0 ? (
                                    <p className="text-[14px] text-[#76777d]">Bạn chưa có mục tiêu nào đang hoạt động.</p>
                                ) : (
                                    <div className="space-y-[24px]">
                                        {goals.map((goal, idx) => {
                                            const color = RING_COLORS[idx % RING_COLORS.length]
                                            const dash = `${goal.percentComplete}, 100`
                                            return (
                                                <div key={goal.id} className="flex items-center gap-[16px]">
                                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                                            <path
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="#e5eeff"
                                                                strokeWidth="3"
                                                            ></path>
                                                            <path
                                                                className="progress-ring-circle"
                                                                data-dasharray={dash}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke={color}
                                                                strokeDasharray={dash}
                                                                strokeWidth="3"
                                                                style={{
                                                                    transition: 'stroke-dashoffset 1s ease-in-out',
                                                                    transform: 'rotate(-90deg)',
                                                                    transformOrigin: '50% 50%',
                                                                }}
                                                            ></path>
                                                        </svg>
                                                        <span className="absolute text-[14px] font-bold">{goal.percentComplete}%</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[14px] font-bold">{goal.title}</p>
                                                        <p className="text-[14px] text-[#45464d]">
                                                            {goal.currentValue}/{goal.targetValue} {goal.unit} hoàn thành
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="mt-[24px] pt-[24px] border-t border-[#c6c6cd]">
                                    <div className="flex justify-between items-center mb-[8px]">
                                        <span className="text-[14px] text-[#45464d]">Tổng thể tuần này</span>
                                        <span className="text-[14px] font-bold text-[#6b38d4]">{overallLabel}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#d3e4fe] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#6b38d4] transition-all duration-1000"
                                            style={{ width: `${overallRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}