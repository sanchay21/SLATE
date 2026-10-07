import { CometChatUIKit } from '@cometchat/chat-uikit-react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const APP_ID = import.meta.env.VITE_COMETCHAT_APP_ID;
const REGION = import.meta.env.VITE_COMETCHAT_REGION;
const AUTH_KEY = import.meta.env.VITE_COMETCHAT_AUTH_KEY;

let initPromise: Promise<unknown> | null = null;
let loginInFlight: Promise<unknown> | null = null;

export function initCometChat(): Promise<unknown> {
  if (!APP_ID || !REGION || !AUTH_KEY) {
    throw new Error('CometChat credentials empty — check .env and restart dev server.');
  }

  if (!initPromise) {
    initPromise = CometChatUIKit.initFromSettings({
      appId: APP_ID,
      region: REGION,
      credentials: { authKey: AUTH_KEY },
      chatSDK: { presenceSubscription: { type: 'ALL_USERS' } },
      uiKit: { callsSDK: {} },
    });
  }

  return initPromise;
}

export async function ensureLoggedIn(uid: string, name?: string, avatar?: string) {
  await initCometChat();
  const existing = CometChatUIKit.getLoggedInUser();
  if (existing && existing.getUid?.() === uid) {
    return existing;
  }

  if (existing) {
    await CometChatUIKit.logout();
  }

  if (loginInFlight) {
    await loginInFlight;
    return CometChatUIKit.getLoggedInUser();
  }

  loginInFlight = (async () => {
    try {
      const u = new CometChat.User(uid);
      if (name) u.setName(name);
      if (avatar) u.setAvatar(avatar);
      await CometChatUIKit.createUser(u);
    } catch {
      // User already exists, proceed to login
    }
    return await CometChatUIKit.login(uid);
  })();

  try {
    const user = await loginInFlight;
    return user;
  } finally {
    loginInFlight = null;
  }
}

export async function logoutCometChat() {
  try {
    const existing = CometChatUIKit.getLoggedInUser();
    if (existing) {
      await CometChatUIKit.logout();
    }
  } catch (err) {
    console.warn('CometChat logout warning:', err);
  }
}
