import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export function useOpenSettings() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return () => navigation.navigate('Settings');
}
