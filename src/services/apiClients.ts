// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { refreshToken } from './auth';
// import { API_BASE_URL } from './api';

// let isRefreshing = false;
// let queue: Array<(token: string) => void> = [];

// async function getToken() {
//   return AsyncStorage.getItem('token');
// }

// async function setToken(token: string) {
//   await AsyncStorage.setItem('token', token);
// }

// export async function apiPost<T>(
//   path: string,
//   body: unknown,
//   skipAuth = false,
// ): Promise<T> {
//   const url = `${API_BASE_URL}${
//     path.startsWith('/') ? path : `/${path}`
//   }`;

//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), 30000);

//   const request = async (token?: string) => {
//     return fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         ...(token && !skipAuth && {
//           Authorization: `Bearer ${token}`,
//         }),
//       },
//       body: JSON.stringify(body),
//       signal: controller.signal,
//     });
//   };

//   let token = (await getToken()) ?? undefined;

//   try {
//     let response = await request(token);

//     // =========================
//     // HANDLE 401
//     // =========================
//     if (response.status === 401 && !skipAuth) {
//       const refresh = await AsyncStorage.getItem('refreshToken');

//       if (!refresh) {
//         throw new Error('Missing refresh token');
//       }

//       if (isRefreshing) {
//         const newToken = await new Promise<string>((resolve) => {
//           queue.push(resolve);
//         });

//         response = await request(newToken);
//       } else {
//         isRefreshing = true;

//         try {
//           const data = await refreshToken(refresh, true); 
//           // 👆 nhớ skipAuth = true trong auth.ts

//           const newToken = data.token;

//           await setToken(newToken);

//           queue.forEach((cb) => cb(newToken));
//           queue = [];

//           isRefreshing = false;

//           response = await request(newToken);
//         } catch (err) {
//           isRefreshing = false;
//           queue = [];
//           throw err;
//         }
//       }
//     }

//     clearTimeout(timeout);

//     const data = await response.json().catch(() => ({}));

//     if (!response.ok) {
//       throw new Error(data?.message || 'Server error');
//     }

//     return data as T;
//   } catch (err) {
//     clearTimeout(timeout);
//     throw err;
//   }
// }