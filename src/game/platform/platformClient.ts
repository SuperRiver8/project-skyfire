import './river-sdk.js';
import { RiverPlatform } from './RiverPlatform';

export const riverPlatform = new RiverPlatform(
  window.RiverSDK,
  window.parent !== window,
  import.meta.env.VITE_RIVER_PLATFORM_ORIGIN,
);
