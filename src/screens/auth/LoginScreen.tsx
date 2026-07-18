import { getTypography } from '../../constants/typography';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../../components/ui/AppLogo';
import { APP_EMAIL_PLACEHOLDER } from '../../constants/brand';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TopAppBar } from '../../components/navigation';
import { getTopAppBarHeight, SCROLL_CONTENT_GAP } from '../../constants/layout';
import DividerWithLabel from '../../components/ui/DividerWithLabel';
import AppGlassCard from '../../components/ui/AppGlassCard';
import MeshBackground from '../../components/ui/MeshBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SocialLoginButton from '../../components/ui/SocialLoginButton';
import BorderTextInput from '../../components/ui/BorderTextInput';
import PasswordInput from '../../components/ui/PasswordInput';
import { useTheme } from '../../hooks/useTheme';

import { SPACING } from '../../constants/spacing';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_WEB_CLIENT_ID } from '../../constants/config';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';
import { resetPassword, forgotPassword } from '../../services/auth';
import { configureGoogleSignIn, getGoogleIdToken, statusCodes } from '../../services/googleAuth';
import OTPVerificationModal from '../../components/auth/OTPVerificationModal';
import ResetPasswordModal from '../../components/auth/ResetPasswordModal';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const insets = useSafeAreaInsets();
  const topBarHeight = getTopAppBarHeight(insets);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const [activeModal, setActiveModal] = useState<{
    type: 'none' | 'forgot' | 'otp' | 'reset';
    email?: string;
    otp?: string;
  }>({ type: 'none' });

  const [resetEmail, setResetEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');

  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      const rootNavigation = navigation.getParent();
      rootNavigation?.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
      Alert.alert('Lỗi đăng nhập', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const { idToken, serverAuthCode } = await getGoogleIdToken();
      await signInWithGoogle(idToken, serverAuthCode);
      const rootNavigation = navigation.getParent();
      rootNavigation?.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      let errorMessage = 'Đăng nhập bằng Google thất bại.';
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
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await forgotPassword(email);
      setResetEmail(email);
      setActiveModal({ type: 'otp', email });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi mã xác thực.';
      Alert.alert('Lỗi', message);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setVerifiedOtp(otp);
      setActiveModal({ type: 'reset', email: activeModal.email });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP không hợp lệ';
      Alert.alert('Lỗi', message);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    try {
      await resetPassword({
        email: resetEmail,
        otp: verifiedOtp,
        newPassword,
      });

      setActiveModal({ type: 'none' });
      setResetEmail('');
      setVerifiedOtp('');

      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu';
      Alert.alert('Lỗi', message);
    }
  };

  const closePasswordResetFlow = () => {
    Keyboard.dismiss();
    setActiveModal({ type: 'none' });
    setResetEmail('');
    setVerifiedOtp('');
  };

  const openForgotPassword = () => {
    Keyboard.dismiss();
    setActiveModal({ type: 'forgot' });
  };

  return (
    <View style={styles.root}>
      <MeshBackground />
      <TopAppBar />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -40} 
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topBarHeight + SCROLL_CONTENT_GAP,
              paddingBottom: insets.bottom + 48,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.hero}>
              <AppLogo size={88} style={styles.heroLogo} />
              <Text style={styles.heroTitle}>Chào mừng trở lại</Text>
              <Text style={styles.heroSubtitle}>
                Đăng nhập để tiếp tục trải nghiệm AI thông minh.
              </Text>
            </View>

            <AppGlassCard variant="ai" padding={32}>
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
                autoComplete="password"
                textContentType="password"
              />
              
              <View style={styles.forgotContainer}>
                <Text style={styles.forgotLink} onPress={openForgotPassword}>
                  Quên mật khẩu?
                </Text>
              </View>

              <View style={styles.buttonGap} />

              <PrimaryButton
                label="Đăng nhập"
                loading={loading}
                onPress={handleLogin}
              />

              <DividerWithLabel />

              <SocialLoginButton
                label="Tiếp tục với Google"
                onPress={handleGoogleLogin}
              />
            </AppGlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Chưa có tài khoản?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => {
                    Keyboard.dismiss();
                    navigation.navigate('Register');
                  }}
                >
                  Đăng ký ngay
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={activeModal.type === 'forgot'}
        onClose={closePasswordResetFlow}
        onSubmit={handleForgotPassword}
      />

      <OTPVerificationModal
        visible={activeModal.type === 'otp'}
        email={resetEmail || activeModal.email || ''}
        onClose={closePasswordResetFlow}
        onVerify={handleVerifyOtp}
      />

      <ResetPasswordModal
        visible={activeModal.type === 'reset'}
        email={resetEmail || activeModal.email || ''}
        onClose={closePasswordResetFlow}
        onSubmit={handleResetPassword}
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
  },
  inner: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  hero: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroLogo: {
    marginBottom: 20,
  },
  heroTitle: {
    ...typography.displayLgMobile,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  fieldGap: {
    height: 24,
  },
  buttonGap: {
    height: 16,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotLink: {
    ...typography.linkSmall,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  footerLink: {
    ...typography.bodyMd,
    color: COLORS.primary,
    fontWeight: '700',
  },
});