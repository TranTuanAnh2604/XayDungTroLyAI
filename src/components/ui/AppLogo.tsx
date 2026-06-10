import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { APP_LOGO } from '../../constants/assets';

type AppLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function AppLogo({
  size = 40,
  style,
  imageStyle,
}: AppLogoProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={APP_LOGO}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          imageStyle,
        ]}
        resizeMode="contain"
        accessibilityLabel="Hivic AI"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
