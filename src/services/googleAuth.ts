// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin';

// export function configureGoogleSignIn(webClientId: string) {
//   GoogleSignin.configure({
//     webClientId,
//     offlineAccess: true,
//     // FIX: phải khai báo rõ scope 'gmail.readonly', nếu không refresh token
//     // chỉ có quyền email/profile cơ bản, backend gọi Gmail API sẽ bị từ chối
//     // (insufficient scope) -> không bao giờ lấy/lưu được email nào vào DB.
//     scopes: [
//       'email',
//       'profile',
//       'https://www.googleapis.com/auth/gmail.readonly',
//     ],
//   });
// }

// export async function getGoogleIdToken(): Promise<string> {
//   await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

//   try {
//     await signOutGoogle();
//   } catch (error) {
//     console.log('Google sign-out cleanup before signIn failed:', error);
//   }

//   await GoogleSignin.signIn();

//   const tokens = await GoogleSignin.getTokens();
//   const idToken = tokens.idToken;

//   if (!idToken) {
//     throw new Error('Không nhận được ID Token từ Google');
//   }

//   return idToken;
// }

// export async function signOutGoogle(): Promise<void> {
//   try {
//     const tokens = await GoogleSignin.getTokens();
//     if (tokens?.accessToken) {
//       try {
//         await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
//       } catch (error) {
//         console.log('GoogleSignin.clearCachedAccessToken failed:', error);
//       }
//     }
//   } catch (error) {
//     console.log('GoogleSignin.getTokens failed while signing out:', error);
//   }

//   try {
//     await GoogleSignin.revokeAccess();
//   } catch (error) {
//     console.log('GoogleSignin.revokeAccess failed:', error);
//   }

//   try {
//     await GoogleSignin.signOut();
//   } catch (error) {
//     console.log('GoogleSignin.signOut failed:', error);
//   }
// }

// export { statusCodes };
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';

let googleSignInConfigured = false;

export function configureGoogleSignIn(webClientId: string) {
  googleSignInConfigured = true;
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: [
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  });
}

/**
 * Đăng nhập Google và trả về CẢ idToken (để xác thực user)
 * VÀ serverAuthCode (để backend đổi sang refresh_token thật, dùng gọi Gmail API).
 *
 * Lưu ý: serverAuthCode chỉ dùng được DUY NHẤT 1 LẦN. Nếu gọi đổi code 2 lần
 * (vd: gọi nhầm API connect 2 lần với cùng code) Google sẽ trả lỗi invalid_grant.
 */
function ensureGoogleSignInConfigured() {
  if (!googleSignInConfigured) {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
  }
}

export async function getGoogleIdToken(): Promise<{
  idToken: string;
  serverAuthCode: string;
}> {
  ensureGoogleSignInConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.log('GoogleSignin.signOut before signIn failed:', error);
  }

  const userInfo = await GoogleSignin.signIn();

  // Tuỳ version của @react-native-google-signin/google-signin, serverAuthCode
  // có thể nằm ở userInfo.serverAuthCode (v9-) hoặc userInfo.data.serverAuthCode (v10+)
  const serverAuthCode =
    (userInfo as any)?.serverAuthCode ??
    (userInfo as any)?.data?.serverAuthCode;

  const tokens = await GoogleSignin.getTokens();
  const idToken = tokens.idToken;

  if (!idToken) {
    throw new Error('Không nhận được ID Token từ Google');
  }

  if (!serverAuthCode) {
    throw new Error(
      'Không nhận được serverAuthCode từ Google. Kiểm tra lại offlineAccess: true trong GoogleSignin.configure, và đảm bảo webClientId đúng loại "Web application" trên Google Cloud Console.',
    );
  }

  console.log('🔑 signInWithGoogle: idToken length =', idToken.length);
  console.log('🔑 signInWithGoogle: serverAuthCode length =', serverAuthCode.length);

  return { idToken, serverAuthCode };
}

// Giữ lại hàm cũ để không phá vỡ những nơi khác đang gọi getGoogleIdToken(),
// nhưng khuyến nghị chuyển sang dùng signInWithGoogle() ở trên cho luồng liên kết Gmail.
// export async function getGoogleIdToken(): Promise<string> {
//   await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

//   try {
//     await GoogleSignin.signOut();
//   } catch (error) {
//     console.log('GoogleSignin.signOut before signIn failed:', error);
//   }

//   await GoogleSignin.signIn();

//   const tokens = await GoogleSignin.getTokens();
//   const idToken = tokens.idToken;

//   if (!idToken) {
//     throw new Error('Không nhận được ID Token từ Google');
//   }

//   return idToken;
// }

export async function signOutGoogle(): Promise<void> {
  try {
    const tokens = await GoogleSignin.getTokens();
    if (tokens?.accessToken) {
      try {
        await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
      } catch (error) {
        console.log('GoogleSignin.clearCachedAccessToken failed:', error);
      }
    }
  } catch (error) {
    console.log('GoogleSignin.getTokens failed while signing out:', error);
  }

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