import { getTypography } from '../../constants/typography';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthHeroBranding from '../../components/auth/AuthHeroBranding';
import OTPVerificationModal from '../../components/auth/OTPVerificationModal';
import BorderTextInput from '../../components/ui/BorderTextInput';
import DividerWithLabel from '../../components/ui/DividerWithLabel';
import GlassCard from '../../components/ui/GlassCard';
import MeshBackground from '../../components/ui/MeshBackground';
import PasswordInput from '../../components/ui/PasswordInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SocialLoginButton from '../../components/ui/SocialLoginButton';
import { APP_COPYRIGHT, APP_EMAIL_PLACEHOLDER } from '../../constants/brand';
import { useTheme } from '../../hooks/useTheme';

import { SPACING } from '../../constants/spacing';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { completeRegistrationWithOtp } from '../../services/authFlow';
import { configureGoogleSignIn, getGoogleIdToken, statusCodes } from '../../services/googleAuth';
import { GOOGLE_WEB_CLIENT_ID } from '../../constants/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const { signUp, signInWithGoogle, setAuthDataFromOTP } = useAuth();

  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    setIsRegistering(true);

    try {
      console.log('📝 Đang đăng ký...', { fullName, email });
      await signUp(fullName.trim(), email.trim(), password);
      console.log('✅ Đăng ký thành công, hiển thị OTP modal...');
      

      setShowOTPModal(true);
      setIsRegistering(false);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại.';
      console.log('❌ Lỗi đăng ký:', message);
      Alert.alert('Lỗi đăng ký', message);
      setIsRegistering(false);
    }
  };
  
  const handleVerifyOTP = async (otp: string) => {
    try {
      console.log('EMAIL:', email.trim());
    console.log('PASSWORD length:', password.length);

    const authData = await completeRegistrationWithOtp(
      email.trim(),
      password,
      otp,
    );
      console.log('AUTH:', authData);

    await setAuthDataFromOTP(authData);

    setShowOTPModal(false);

    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
    } catch (error) {
     console.log('OTP ERROR:', error);
    throw error;
    }
  };

  const handleCloseOTPModal = () => {
    setShowOTPModal(false);
    // Reset registration state
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleGoogleSignUp = async () => {
    setIsRegistering(true);

    try {
      const { idToken, serverAuthCode } = await getGoogleIdToken();
      console.log('🔑 RegisterScreen: received serverAuthCode length =', serverAuthCode?.length);
      await signInWithGoogle(idToken, serverAuthCode);
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      let errorMessage = 'Đăng ký bằng Google thất bại.';
      if (error instanceof Error) {
        const errorCode = (error as any).code;
        if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
          errorMessage = 'Bạn đã hủy đăng nhập.';
        } else if (errorCode === statusCodes.IN_PROGRESS) {
          errorMessage = 'Đăng nhập đang được xử lý...';
        } else if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          errorMessage = 'Google Play Services không có trên thiết bị này.';
        } else {
          errorMessage = error.message;
        }
      }
      console.log('❌ Google Register Error:', errorMessage);
      Alert.alert('Lỗi đăng ký Google', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="register" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <AuthHeroBranding />

            <GlassCard tone="register">
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tạo tài khoản</Text>
                <Text style={styles.cardSubtitle}>
                  Bắt đầu hành trình của bạn ngay hôm nay.
                </Text>
              </View>

              <BorderTextInput
                label="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nguyễn Văn A"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />

              <View style={styles.fieldGap} />

              <BorderTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder={APP_EMAIL_PLACEHOLDER}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <View style={styles.fieldGap} />

              <PasswordInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                autoComplete="password-new"
                textContentType="newPassword"
              />

              <View style={styles.fieldGap} />

              <PasswordInput
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                autoComplete="password-new"
                textContentType="newPassword"
              />

              <View style={styles.buttonGap} />

              <PrimaryButton
                label="Đăng ký"
                loading={isRegistering}
                onPress={handleRegister}
              />

              <DividerWithLabel variant="lines" />

              <SocialLoginButton
                label="Đăng ký với Google"
                variant="register"
                onPress={handleGoogleSignUp}
              />

              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Bạn đã có tài khoản?{' '}
                  <Text
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                  >
                    Đăng nhập
                  </Text>
                </Text>
              </View>
            </GlassCard>

            <Text style={styles.copyright}>{APP_COPYRIGHT}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        visible={showOTPModal}
        email={email}
        onVerify={handleVerifyOTP}
        onClose={handleCloseOTPModal}
      />
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.containerMobile,
    paddingVertical: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  cardHeader: {
    marginBottom: 32,
  },
  cardTitle: {
    ...typography.headlineMd,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.bodyMd,
  },
  fieldGap: {
    height: 24,
  },
  buttonGap: {
    height: 16,
  },
  loginPrompt: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginPromptText: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  loginLink: {
    ...typography.bodyMd,
    color: COLORS.primary,
    fontWeight: '700',
  },
  copyright: {
    ...typography.labelCaps,
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
});
