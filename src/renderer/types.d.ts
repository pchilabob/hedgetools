import type { Api } from '../preload';

declare global {
  interface Window {
    cs2: Api;
  }
}
