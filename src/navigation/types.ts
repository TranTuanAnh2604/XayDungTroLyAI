import type { AppTabId } from '../types/navigation';

export type RootStackParamList = {
  Auth: undefined;
  Main: { tab?: AppTabId } | undefined;
  Settings: undefined;
  EditProfile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
