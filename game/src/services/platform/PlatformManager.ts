import { IPlatformService } from './IPlatformService.js';
import { FacebookPlatformService } from './FacebookPlatformService.js';
import { MockPlatformService } from './MockPlatformService.js';

let platformInstance: IPlatformService | null = null;

export function getPlatformService(): IPlatformService {
  if (!platformInstance) {
    if (typeof window !== 'undefined' && typeof window.FBInstant !== 'undefined') {
      platformInstance = new FacebookPlatformService();
    } else {
      platformInstance = new MockPlatformService();
    }
  }
  return platformInstance;
}
