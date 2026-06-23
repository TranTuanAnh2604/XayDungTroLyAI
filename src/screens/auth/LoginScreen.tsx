import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../../components/ui/AppLogo';
import { APP_EMAIL_PLACEHOLDER } from '../../constants/brand';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TopAppBar } from '../../components/navigation';
import { getTopAppBarHeight, SCROLL_CONTENT_GAP } from '../../constants/layout';
import DividerWithLabel from '../../components/ui/DividerWithLabel';
import GlassCard from '../../components/ui/GlassCard';
import MeshBackground from '../../components/ui/MeshBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SocialLoginButton from '../../components/ui/SocialLoginButton';
import UnderlineTextInput from '../../components/ui/UnderlineTextInput';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
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
  const insets = useSafeAreaInsets();
  const topBarHeight = getTopAppBarHeight(insets);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    setLoading(true);
    
    try {
      const idToken = await getGoogleIdToken();
      await signInWithGoogle(idToken);
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
      console.log('❌ Google Login Error:', errorMessage);
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
    const message =
      error instanceof Error ? error.message : 'Không thể gửi mã xác thực.';

    Alert.alert('Lỗi', message);
  }
};

const handleVerifyOtp = async (otp: string) => {
  try {
    setVerifiedOtp(otp);

  setActiveModal({ type: 'reset', email: activeModal.email });


  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'OTP không hợp lệ';

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


    Alert.alert(
      'Thành công',
      'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Không thể đặt lại mật khẩu';

    Alert.alert('Lỗi', message);
  }
};

const closePasswordResetFlow = () => {
  setActiveModal({ type: 'none' });
  setResetEmail('');
  setVerifiedOtp('');
};

const openForgotPassword = () => {
  setActiveModal({ type: 'forgot' });
};
  return (
    <View style={styles.root}>
      <MeshBackground />
      <TopAppBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

            <GlassCard>
              <AppLogo size={32} style={styles.cardLogo} />

              <UnderlineTextInput
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

              <UnderlineTextInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                labelRight={
                  <View style={styles.passwordLabelRight}>
                    <Pressable
                      onPress={() => setShowPassword((value) => !value)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={showPassword ? COLORS.primary : COLORS.outline}
                      />
                    </Pressable>
                    <Text
                      style={styles.forgotLink}
                      onPress={openForgotPassword}
                    >
                      Quên mật khẩu?
                    </Text>
                  </View>
                }
              />

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
            </GlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Chưa có tài khoản?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => navigation.navigate('Register')}
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

const styles = StyleSheet.create({
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
  cardLogo: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    opacity: 0.85,
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
    height: 24,
  },
  forgotLink: {
    ...typography.linkSmall,
  },
  passwordLabelRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
