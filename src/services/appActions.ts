import { Linking } from 'react-native';
import { markActionExecuted } from './chat'; 
import type { ActionResult } from '../types/chat';

export async function openAppAction(action: ActionResult): Promise<boolean> {
  try {
    if (action.deepLink) {
      const canOpen = await Linking.canOpenURL(action.deepLink);
      if (canOpen) {
        await Linking.openURL(action.deepLink);
        await markActionExecuted(action.actionId);
        return true;
      }
    }
    // App chưa cài hoặc không có deep link -> mở fallback (web/store)
    await Linking.openURL(action.fallbackUrl);
    await markActionExecuted(action.actionId);
    return true;
  } catch (err) {
    console.log('Không thể mở app:', err);
    return false;
  }
}
