import { IPlatformService } from './IPlatformService.js';
import { FacebookPlatformService } from './FacebookPlatformService.js';
import { MockPlatformService } from './MockPlatformService.js';

let platformInstance: IPlatformService | null = null;

/**
 * The FB Instant SDK script defines window.FBInstant even on localhost.
 * Calling initializeAsync() outside Facebook hangs forever — so only use
 * the Facebook adapter when we are actually hosted on an Instant Games domain.
 */
function isFacebookInstantEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof window.FBInstant === 'undefined') {
    return false;
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;

  return (
    host.endsWith('facebook.com') ||
    host.endsWith('fb.gg') ||
    host.includes('fbsbx.com') ||
    host.includes('fbcdn.net')
  );
}

export function getPlatformService(): IPlatformService {
  if (!platformInstance) {
    if (isFacebookInstantEnvironment()) {
      platformInstance = new FacebookPlatformService();
    } else {
      platformInstance = new MockPlatformService();
    }
  }
  return platformInstance;
}
