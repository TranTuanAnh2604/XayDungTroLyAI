import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
  });
}

export async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();

  const tokens = await GoogleSignin.getTokens();
  const idToken = tokens.idToken;

  if (!idToken) {
    throw new Error('Không nhận được ID Token từ Google');
  }

  return idToken;
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.revokeAccess();
  } catch (error) {
    console.log('GoogleSignin.revokeAccess failed:', error);
  }

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.log('GoogleSignin.signOut failed:', error);
  }
}

export { statusCodes };
