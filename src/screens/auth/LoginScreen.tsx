import React, { useState } from 'react';
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
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topBarHeight = getTopAppBarHeight(insets);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
      Alert.alert('Lỗi đăng nhập', message);
    } finally {
      setLoading(false);
    }
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
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                labelRight={
                  <Pressable hitSlop={8}>
                    <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                  </Pressable>
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
                onPress={() => {}}
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
