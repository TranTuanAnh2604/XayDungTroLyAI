# Hướng dẫn sử dụng Popup Quên Mật Khẩu

## 📋 Tổng quan

Dự án hiện có ba popup xác thực:
- **ForgotPasswordModal** (Quên mật khẩu) - Nhập email
- **OTPVerificationModal** (Xác nhận OTP) - Nhập mã OTP (đã có sẵn)
- **ResetPasswordModal** (Đặt lại mật khẩu) - Nhập mật khẩu mới

## 🎯 Luồng sử dụng

```
ForgotPasswordModal (Email)
        ↓
OTPVerificationModal (OTP 6 chữ số)
        ↓
ResetPasswordModal (Mật khẩu mới)
```

## 🚀 Cách tích hợp

### 1. Import các component

```typescript
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';
import ResetPasswordModal from '@/components/auth/ResetPasswordModal';
```

### 2. Quản lý state

```typescript
const [flow, setFlow] = useState({
  visible: false,
  email: '',
  step: 'idle', // 'forgot' | 'otp' | 'reset' | 'idle'
});
```

### 3. Xử lý các bước

```typescript
// Bước 1: Mở popup quên mật khẩu
const handleForgotPassword = () => {
  setFlow({ visible: true, step: 'forgot' });
};

// Bước 2: Gửi email (gọi API)
const handleForgotSubmit = async (email: string) => {
  // Gọi API: POST /api/password-reset/request
  const response = await api.requestPasswordReset(email);
  
  // Chuyển sang OTP verification
  setFlow({ 
    visible: true, 
    email, 
    step: 'otp' 
  });
};

// Bước 3: Xác nhận OTP (gọi API)
const handleOTPVerify = async (otp: string) => {
  // Gọi API: POST /api/password-reset/verify-otp
  const response = await api.verifyResetOTP(flow.email, otp);
  
  // Chuyển sang reset password
  setFlow({ 
    visible: true, 
    email: flow.email, 
    step: 'reset' 
  });
};

// Bước 4: Đặt lại mật khẩu (gọi API)
const handleResetSubmit = async (newPassword: string) => {
  // Gọi API: POST /api/password-reset/confirm
  const response = await api.confirmPasswordReset(
    flow.email, 
    newPassword
  );
  
  // Đóng popup và hiển thị thông báo thành công
  setFlow({ visible: false, step: 'idle' });
  Alert.alert('Thành công', 'Mật khẩu đã được cập nhật');
};
```

### 4. Render các popup

```typescript
<ForgotPasswordModal
  visible={flow.visible && flow.step === 'forgot'}
  onClose={() => setFlow({ ...flow, visible: false })}
  onSubmit={handleForgotSubmit}
/>

<OTPVerificationModal
  visible={flow.visible && flow.step === 'otp'}
  email={flow.email}
  onVerify={handleOTPVerify}
  onClose={() => setFlow({ ...flow, visible: false })}
/>

<ResetPasswordModal
  visible={flow.visible && flow.step === 'reset'}
  email={flow.email}
  onClose={() => setFlow({ ...flow, visible: false })}
  onSubmit={handleResetSubmit}
/>
```

## 📱 Ví dụ đầy đủ trong LoginScreen

```typescript
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';
import ResetPasswordModal from '@/components/auth/ResetPasswordModal';
import { apiPost } from '@/services/api';

export default function LoginScreen() {
  const [flow, setFlow] = useState({
    visible: false,
    email: '',
    step: 'idle',
  });

  const handleForgotPasswordSubmit = async (email: string) => {
    try {
      // API call
      await apiPost('/password-reset/request', { email });
      
      setFlow({ visible: true, email, step: 'otp' });
    } catch (error) {
      throw error;
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      // API call
      await apiPost('/password-reset/verify-otp', {
        email: flow.email,
        otp,
      });
      
      setFlow({ visible: true, email: flow.email, step: 'reset' });
    } catch (error) {
      throw error;
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    try {
      // API call
      await apiPost('/password-reset/confirm', {
        email: flow.email,
        newPassword,
      });
      
      setFlow({ visible: false, step: 'idle' });
    } catch (error) {
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {/* Login form */}
      <Pressable onPress={() => setFlow({ visible: true, step: 'forgot' })}>
        <Text>Quên mật khẩu?</Text>
      </Pressable>

      {/* Modals */}
      <ForgotPasswordModal
        visible={flow.visible && flow.step === 'forgot'}
        onClose={() => setFlow({ ...flow, visible: false })}
        onSubmit={handleForgotPasswordSubmit}
      />

      <OTPVerificationModal
        visible={flow.visible && flow.step === 'otp'}
        email={flow.email}
        onVerify={handleOTPVerify}
        onClose={() => setFlow({ ...flow, visible: false })}
      />

      <ResetPasswordModal
        visible={flow.visible && flow.step === 'reset'}
        email={flow.email}
        onClose={() => setFlow({ ...flow, visible: false })}
        onSubmit={handleResetPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

## 🎨 Tính năng của từng popup

### ForgotPasswordModal
- ✅ Nhập email với validation
- ✅ Nút "Tiếp tục"
- ✅ Thông báo hướng dẫn
- ✅ Nút đóng

### OTPVerificationModal (có sẵn)
- ✅ Nhập OTP 6 chữ số
- ✅ Timer đếm ngược để gửi lại OTP
- ✅ Nút "Gửi lại mã"
- ✅ Nút xác nhận

### ResetPasswordModal
- ✅ Nhập mật khẩu mới
- ✅ Xác nhận mật khẩu
- ✅ Thanh chỉ số độ mạnh mật khẩu (Yếu/Vừa phải/Mạnh)
- ✅ Chỉ báo khi mật khẩu không khớp
- ✅ Danh sách yêu cầu mật khẩu:
  - Ít nhất 8 ký tự
  - Mật khẩu khớp

## 🔐 Yêu cầu API

### 1. Request Password Reset
```
POST /api/password-reset/request
Body: { email: string }
Response: { success: boolean; message: string }
```

### 2. Verify OTP
```
POST /api/password-reset/verify-otp
Body: { email: string; otp: string }
Response: { success: boolean; token: string }
```

### 3. Confirm Password Reset
```
POST /api/password-reset/confirm
Body: { email: string; newPassword: string }
Response: { success: boolean; message: string }
```

## 📝 Các props của component

### ForgotPasswordModal

| Prop | Type | Description |
|------|------|-------------|
| `visible` | boolean | Hiển thị/ẩn popup |
| `onClose` | () => void | Callback khi đóng popup |
| `onSubmit` | (email: string) => Promise<void> | Callback khi submit email |

### ResetPasswordModal

| Prop | Type | Description |
|------|------|-------------|
| `visible` | boolean | Hiển thị/ẩn popup |
| `email` | string | Email của người dùng (hiển thị trong subtitle) |
| `onClose` | () => void | Callback khi đóng popup |
| `onSubmit` | (newPassword: string) => Promise<void> | Callback khi submit mật khẩu mới |

## 🧪 Testing

```typescript
// Test ForgotPasswordModal
import { render, fireEvent } from '@testing-library/react-native';

test('should submit email', async () => {
  const onSubmit = jest.fn();
  const { getByTestId, getByText } = render(
    <ForgotPasswordModal
      visible={true}
      onSubmit={onSubmit}
      onClose={() => {}}
    />
  );

  const emailInput = getByTestId('forgot-password-email');
  fireEvent.changeText(emailInput, 'test@example.com');
  
  const submitButton = getByText('Tiếp tục');
  fireEvent.press(submitButton);

  expect(onSubmit).toHaveBeenCalledWith('test@example.com');
});
```

## ⚠️ Lưu ý quan trọng

1. **Email Validation**: ForgotPasswordModal có validation email tự động
2. **Password Validation**: ResetPasswordModal kiểm tra:
   - Độ dài ≥ 8 ký tự
   - Mật khẩu khớp với xác nhận
3. **Error Handling**: Luôn xử lý lỗi từ API calls
4. **Loading State**: Popup tự động disable input khi đang loading
5. **Keyboard Avoidance**: Hỗ trợ iOS và Android

## 🚨 Xử lý lỗi

```typescript
const handleForgotPasswordSubmit = async (email: string) => {
  try {
    await apiPost('/password-reset/request', { email });
    setFlow({ visible: true, email, step: 'otp' });
  } catch (error) {
    // Popup sẽ tự động hiển thị Alert
    throw new Error('Email không tồn tại trong hệ thống');
  }
};
```

---

Các file component được tạo:
- `src/components/auth/ForgotPasswordModal.tsx`
- `src/components/auth/ResetPasswordModal.tsx`
- `src/components/auth/PasswordResetFlow.tsx` (ví dụ đầy đủ)
