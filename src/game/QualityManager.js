/**
 * Device detection and quality tier management.
 * Detects device capability and provides quality settings for renderer, physics, etc.
 */

const QUALITY_PROFILES = {
  high: {
    maxCoins: 999,
    shadowMapSize: 1024,
    shadowType: 'PCFSoft',
    coinCastShadow: true,
    pixelRatioCap: 2,
    antialias: true,
    solverIterations: 15,
    coinRenderSegments: 24,
    coinPhysicsSegments: 16,
    useSpotLight: true,
    bgDecorationScale: 1.0,   // full decorations
    bgAnimSkip: 1,             // every frame
    bgShaderSparkle: true,
  },
  medium: {
    maxCoins: 200,
    shadowMapSize: 512,
    shadowType: 'PCF',
    coinCastShadow: false,
    pixelRatioCap: 1.5,
    antialias: false,
    solverIterations: 10,
    coinRenderSegments: 16,
    coinPhysicsSegments: 12,
    useSpotLight: false,
    bgDecorationScale: 0.5,   // half decorations
    bgAnimSkip: 2,             // every other frame
    bgShaderSparkle: true,
  },
  low: {
    maxCoins: 120,
    shadowMapSize: 0,          // shadows disabled
    shadowType: null,
    coinCastShadow: false,
    pixelRatioCap: 1,
    antialias: false,
    solverIterations: 7,
    coinRenderSegments: 12,
    coinPhysicsSegments: 8,
    useSpotLight: false,
    bgDecorationScale: 0,     // minimal decorations
    bgAnimSkip: 4,             // every 4th frame
    bgShaderSparkle: false,
  },
};

export class QualityManager {
  constructor() {
    this.tier = this._detectTier();
    this.settings = QUALITY_PROFILES[this.tier];
  }

  get(key) {
    return this.settings[key];
  }

  _detectTier() {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || ('ontouchstart' in window && navigator.maxTouchPoints > 1);

    if (!isMobile) return 'high';

    // Check hardware signals
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2; // GB

    // Check GPU via WebGL
    let isWeakGPU = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
          isWeakGPU = /Mali-[GT]|Adreno\s[23]\d{2}|PowerVR/i.test(gpu);
        }
        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();
      }
    } catch (e) {
      // ignore WebGL detection failure
    }

    if (isWeakGPU || cores <= 4 || memory <= 3) return 'low';
    return 'medium';
  }
}
