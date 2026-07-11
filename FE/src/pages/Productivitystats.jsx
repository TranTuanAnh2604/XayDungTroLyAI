import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { getWeeklyStats, getMonthlyStats } from '../services/statsService'

const RING_COLORS = ['#8455ef', '#565e74', '#6b38d4', '#45464d']
const AXIS_TICKS = 4 // số mốc chia trục tung (không tính mốc 0)

export default function ProductivityStats() {
    const chartRef = useRef(null)
    const reportRef = useRef(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [exporting, setExporting] = useState(false)

    // 'week' hoặc 'month'
    const [period, setPeriod] = useState('week')
    // Mốc tháng đang xem (chỉ dùng khi period === 'month')
    const [monthCursor, setMonthCursor] = useState(() => {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
    })

    useEffect(() => {
        let isMounted = true
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data =
                    period === 'week'
                        ? await getWeeklyStats()
                        : await getMonthlyStats(monthCursor.year, monthCursor.month)
                if (isMounted) setStats(data)
            } catch (e) {
                console.error('Không tải được thống kê', e)
                if (isMounted) setError('Không tải được dữ liệu thống kê.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [period, monthCursor])

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

    const primaryColor = stats?.categories?.[0]?.color || '#6b38d4'
    const days = stats?.days || []
    const periodLabel = stats?.periodLabel

    // Trục tung luôn chia theo GIỜ TRÒN (1h, 2h, 3h...), không hiển thị số lẻ.
    // Cách làm: làm tròn giá trị lớn nhất lên bội số của AXIS_TICKS giờ, để mỗi
    // mốc chia (maxHours / AXIS_TICKS) luôn là số nguyên.
    const rawMaxHours = Math.max(...days.map((d) => (d.totalMinutes || 0) / 60), 1)
    const maxHours = Math.max(AXIS_TICKS, Math.ceil(rawMaxHours / AXIS_TICKS) * AXIS_TICKS)
    const maxMinutes = maxHours * 60
    const axisTicks = Array.from({ length: AXIS_TICKS + 1 }, (_, i) => (maxHours / AXIS_TICKS) * (AXIS_TICKS - i))

    const formatMinutes = (mins) => {
        if (mins <= 0) return '0h'
        if (mins < 60) return `${Math.round(mins)}p`
        const hours = mins / 60
        return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
    }
    const goals = stats?.goals || []
    const overallRate = stats?.overallCompletionRate ?? 0

    const overallLabel =
        overallRate >= 80 ? 'Tuyệt vời!' : overallRate >= 50 ? 'Khá tốt' : overallRate > 0 ? 'Cần cố gắng hơn' : 'Chưa có dữ liệu'

    const goToPrevMonth = () => {
        setMonthCursor((prev) => {
            const month = prev.month === 1 ? 12 : prev.month - 1
            const year = prev.month === 1 ? prev.year - 1 : prev.year
            return { year, month }
        })
    }

    const goToNextMonth = () => {
        setMonthCursor((prev) => {
            const month = prev.month === 12 ? 1 : prev.month + 1
            const year = prev.month === 12 ? prev.year + 1 : prev.year
            return { year, month }
        })
    }

    const handleExportPdf = async () => {
        if (!reportRef.current || exporting) return
        setExporting(true)
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas-pro'),
                import('jspdf'),
            ])

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#f8f9ff',
                useCORS: true,
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height],
            })
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

            const dateStr = new Date().toISOString().slice(0, 10)
            const suffix = period === 'week' ? 'tuan' : 'thang'
            pdf.save(`bao-cao-nang-suat-${suffix}-${dateStr}.pdf`)
        } catch (e) {
            console.error('Xuất PDF thất bại', e)
            alert('Xuất báo cáo thất bại, vui lòng thử lại.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#f8f9ff] text-[#0b1c30]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Sidebar thực tế của dự án */}
            <Sidebar />

            {/* Main Content - chiếm trọn viewport, không scroll */}
            <main className="ml-[280px] h-screen w-[calc(100%-280px)] bg-[#f8f9ff] flex flex-col overflow-hidden">
                <div className="w-full max-w-[1920px] mx-auto h-full flex flex-col p-[20px] gap-[16px] min-h-0">

                    {/* Page Header - chiều cao cố định, không co giãn */}
                    <div className="shrink-0 flex justify-between items-end">
                        <div>
                            <h2 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-semibold mb-[4px]">
                                Báo cáo &amp; Phân tích năng suất
                            </h2>
                            <p className="text-[14px] leading-[1.4] text-[#45464d]">
                                {periodLabel
                                    ? `Dữ liệu: ${periodLabel}`
                                    : period === 'week'
                                        ? 'Dữ liệu tổng hợp tuần này'
                                        : 'Dữ liệu tổng hợp tháng này'}
                            </p>
                        </div>
                        <div className="flex items-center gap-[12px]">
                            {/* Toggle Tuần / Tháng */}
                            <div className="flex items-center bg-white/70 backdrop-blur-md border border-[#e2e8f0] rounded-lg p-[3px] text-[13px] font-medium">
                                <button
                                    onClick={() => setPeriod('week')}
                                    className={`px-[12px] py-[6px] rounded-md transition-colors ${period === 'week' ? 'bg-black text-white' : 'text-[#45464d] hover:bg-[#dce9ff]'
                                        }`}
                                >
                                    Tuần
                                </button>
                                <button
                                    onClick={() => setPeriod('month')}
                                    className={`px-[12px] py-[6px] rounded-md transition-colors ${period === 'month' ? 'bg-black text-white' : 'text-[#45464d] hover:bg-[#dce9ff]'
                                        }`}
                                >
                                    Tháng
                                </button>
                            </div>

                            {/* Điều hướng tháng trước/sau - chỉ hiện khi đang xem theo tháng */}
                            {period === 'month' && (
                                <div className="flex items-center gap-[4px] bg-white/70 backdrop-blur-md border border-[#e2e8f0] rounded-lg px-[6px] py-[5px]">
                                    <button
                                        onClick={goToPrevMonth}
                                        className="w-[26px] h-[26px] flex items-center justify-center rounded-md hover:bg-[#dce9ff] transition-colors"
                                        title="Tháng trước"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    <span className="text-[13px] font-medium px-[4px] min-w-[64px] text-center">
                                        {monthCursor.month}/{monthCursor.year}
                                    </span>
                                    <button
                                        onClick={goToNextMonth}
                                        className="w-[26px] h-[26px] flex items-center justify-center rounded-md hover:bg-[#dce9ff] transition-colors"
                                        title="Tháng sau"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleExportPdf}
                                disabled={exporting}
                                className="px-[14px] py-[7px] bg-black text-white rounded-lg text-[13px] font-medium flex items-center gap-[6px] hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {exporting ? 'hourglass_top' : 'download'}
                                </span>
                                {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="shrink-0 p-[12px] bg-[#ffdad6] text-[#93000a] rounded-lg text-[13px]">
                            {error}
                        </div>
                    )}

                    {/* Khu vực nội dung chính: chiếm hết phần còn lại, chia 2 cột */}
                    <div ref={reportRef} className="flex-1 min-h-0 grid grid-cols-12 gap-[16px]">

                        {/* Section 1: Time Statistics - 8/12 cột, full chiều cao */}
                        <div className="col-span-8 h-full min-h-0 bg-white/70 backdrop-blur-md border border-[#e2e8f0] p-[20px] rounded-xl shadow-sm flex flex-col">
                            <div className="shrink-0 flex justify-between items-center mb-[16px]">
                                <h3 className="text-[18px] leading-[1.3] font-semibold">
                                    {period === 'week' ? 'Thống kê thời gian tuần này' : 'Thống kê thời gian tháng này'}
                                </h3>
                                <div className="flex items-center gap-[12px]">
                                    <span className="flex items-center gap-[4px] text-[13px] font-medium">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                                        Tổng thời gian
                                    </span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex-1 min-h-0 flex items-center justify-center text-[#76777d] text-[13px]">
                                    Đang tải dữ liệu...
                                </div>
                            ) : days.length === 0 ? (
                                <div className="flex-1 min-h-0 flex items-center justify-center text-[#76777d] text-[13px]">
                                    Chưa có dữ liệu time tracking cho {period === 'week' ? 'tuần' : 'tháng'} này
                                </div>
                            ) : (
                                <div ref={chartRef} className="flex-1 min-h-0 flex gap-[10px]">
                                    {/* Trục tung: hiển thị mốc thời gian theo giờ tròn */}
                                    <div
                                        className="shrink-0 flex flex-col justify-between items-end text-right"
                                        style={{ width: '38px', paddingBottom: '26px' }}
                                    >
                                        {axisTicks.map((t, idx) => (
                                            <span key={idx} className="text-[11px] leading-none text-[#94a3b8]">
                                                {t}h
                                            </span>
                                        ))}
                                    </div>

                                    {/* Khu vực cột + nhãn */}
                                    <div className="flex-1 min-h-0 flex flex-col">
                                        <div className="relative flex-1 min-h-0 flex items-end justify-between gap-4 px-[8px]">
                                            {/* Gridline ngang khớp với từng mốc trục tung */}
                                            {axisTicks.map((t, idx) => (
                                                <div
                                                    key={idx}
                                                    className="absolute left-0 right-0 border-t border-dashed border-[#e5eaf3]"
                                                    style={{ bottom: `${(t / maxHours) * 100}%` }}
                                                ></div>
                                            ))}

                                            {days.map((item) => {
                                                const heightPercent = Math.min(100, (item.totalMinutes / maxMinutes) * 100)
                                                return (
                                                    <div key={item.label + item.date} className="relative z-[1] flex-1 h-full flex flex-col items-center justify-end group">
                                                        <div
                                                            className="w-8 rounded-t-sm chart-bar-transition hover:opacity-80"
                                                            style={{ backgroundColor: primaryColor, height: `${heightPercent}%`, transition: 'height 1s ease-out' }}
                                                            data-height={`${heightPercent}%`}
                                                            title={formatMinutes(item.totalMinutes)}
                                                        ></div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="shrink-0 flex justify-between gap-4 px-[8px] pt-[6px]">
                                            {days.map((item) => (
                                                <div key={item.label + item.date} className="flex-1 flex flex-col items-center text-center">
                                                    <span className="text-[13px] font-medium text-[#45464d]">
                                                        {item.label}
                                                    </span>
                                                    {item.dateRangeLabel && (
                                                        <span className="text-[11px] text-[#94a3b8] leading-tight">
                                                            {item.dateRangeLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Personal Goal Achievement - 4/12 cột, full chiều cao */}
                        <div className="col-span-4 h-full min-h-0 bg-white/70 backdrop-blur-md border border-[#e2e8f0] p-[20px] rounded-xl shadow-sm flex flex-col">
                            <h3 className="shrink-0 text-[18px] leading-[1.3] font-semibold mb-[16px]">Mục tiêu cá nhân</h3>

                            {loading ? (
                                <p className="text-[13px] text-[#76777d]">Đang tải dữ liệu...</p>
                            ) : goals.length === 0 ? (
                                <p className="text-[13px] text-[#76777d]">Bạn chưa có mục tiêu nào đang hoạt động.</p>
                            ) : (
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-[16px] pr-[4px]">
                                    {goals.map((goal, idx) => {
                                        const color = RING_COLORS[idx % RING_COLORS.length]
                                        const dash = `${goal.percentComplete}, 100`
                                        return (
                                            <div key={goal.id} className="flex items-center gap-[14px]">
                                                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
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
                                                    <span className="absolute text-[12px] font-bold">{goal.percentComplete}%</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold truncate">{goal.title}</p>
                                                    <p className="text-[12px] text-[#45464d]">
                                                        {goal.currentValue}/{goal.targetValue} {goal.unit} hoàn thành
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="shrink-0 mt-[16px] pt-[16px] border-t border-[#c6c6cd]">
                                <div className="flex justify-between items-center mb-[8px]">
                                    <span className="text-[13px] text-[#45464d]">
                                        {period === 'week' ? 'Tổng thể tuần này' : 'Tổng thể tháng này'}
                                    </span>
                                    <span className="text-[13px] font-bold text-[#6b38d4]">{overallLabel}</span>
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
            </main>
        </div>
    )
}