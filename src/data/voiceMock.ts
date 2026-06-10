import { APP_NAME, APP_NAME_SHORT } from '../constants/brand';
import type { VoiceCommand, VoiceInsight } from '../types/voice';

export const VOICE_BRAND = {
  title: APP_NAME,
  listeningLabel: 'ĐANG LẮNG NGHE',
  processingHint: `${APP_NAME_SHORT} đang xử lý yêu cầu của bạn`,
};

export const TRANSCRIPTION_PHRASES = [
  'Lên lịch cuộc họp với đội ngũ thiết kế vào lúc 2 giờ chiều mai...',
  'Nhắc tôi mua hoa vào tối nay...',
  'Tóm tắt email mới nhất từ bộ phận kỹ thuật...',
  'Tìm chuyến bay đi Đà Lạt vào cuối tuần này...',
];

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: 'schedule',
    icon: 'calendar-month',
    iconColor: 'primary',
    title: 'Đặt lịch hẹn',
    subtitle: 'Thêm sự kiện mới',
  },
  {
    id: 'suggest',
    icon: 'lightbulb',
    iconColor: 'secondary',
    title: 'Gợi ý AI',
    subtitle: 'Tóm tắt công việc',
  },
];

export const VOICE_INSIGHT: VoiceInsight = {
  label: 'Phân tích nhanh',
  body:
    'Tôi nhận thấy bạn có 3 cuộc họp trống vào chiều mai. Bạn có muốn tôi tối ưu hóa lịch trình để có 2 giờ tập trung không?',
  primaryAction: 'Đồng ý',
  secondaryAction: 'Bỏ qua',
};
