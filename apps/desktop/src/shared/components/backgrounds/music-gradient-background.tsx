import * as PIXI from 'pixi.js';
import { KawaseBlurFilter, TwistFilter } from 'pixi-filters';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useResolveImageUrl } from '@/shared/hooks/use-resolve-image-url';

interface GradientBackgroundProps {
  imageUrl: string;
}

interface AlbumCopy {
  el: PIXI.Sprite;
  scaleMultiplier: number;
  isSmall: boolean;
  trackAngle: number;
  rotationSpeed: number;
  trackSpeed: number;
}

type EffectsState = {
  blur: boolean;
  twist: boolean;
  color: boolean;
  movement: boolean;
};

type FiltersRegistry = {
  blur?: KawaseBlurFilter;
  twist?: TwistFilter;
  color?: PIXI.ColorMatrixFilter;
};

function applyFilters(
  app: PIXI.Application,
  filtersRef: React.MutableRefObject<FiltersRegistry>,
  effectsRef: React.MutableRefObject<EffectsState>,
) {
  filtersRef.current.color = new PIXI.ColorMatrixFilter();
  filtersRef.current.color.saturate(1.4, false);
  filtersRef.current.color.enabled = effectsRef.current.color;

  filtersRef.current.twist = new TwistFilter({
    radius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
    angle: 3.5,
    padding: 0,
    offset: new PIXI.Point(window.innerWidth * 0.4, window.innerHeight * 0.4),
  });
  filtersRef.current.twist.enabled = effectsRef.current.twist;

  filtersRef.current.blur = new KawaseBlurFilter({
    strength: 60,
    quality: 12,
    clamp: true,
  });
  filtersRef.current.blur.enabled = effectsRef.current.blur;

  app.stage.filters = [filtersRef.current.color, filtersRef.current.twist, filtersRef.current.blur];
}

async function loadTexture(resolvedUrl: string): Promise<PIXI.Texture | null> {
  let texture: PIXI.Texture | null = null;

  try {
    const loaded = await PIXI.Assets.load(resolvedUrl);
    if (loaded?.source) {
      texture = loaded;
    }
  } catch (_error) {
    console.warn('PixiJS could not parse the URL, using native fallback method.');
  }

  if (texture) {
    return texture;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = resolvedUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const targetSize = 300;
  const scale = Math.min(targetSize / img.width, targetSize / img.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return PIXI.Texture.from(canvas);
  }

  return PIXI.Texture.from(img);
}

function createAlbumCopies(texture: PIXI.Texture, container: PIXI.Container): AlbumCopy[] {
  const scaleMultipliers: number[] = [2.0, 1.25, 0.8, 0.5, 0.25];

  return scaleMultipliers.map((scale, index) => {
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.blendMode = 'normal';
    sprite.alpha = 1;
    container.addChild(sprite);

    return {
      el: sprite,
      scaleMultiplier: scale,
      isSmall: index >= 3,
      trackAngle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.004,
      trackSpeed: (Math.random() - 0.5) * 0.002,
    };
  });
}

function createResizeHandler(
  copies: AlbumCopy[],
  filtersRef: React.MutableRefObject<FiltersRegistry>,
): () => void {
  return () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (filtersRef.current.twist) {
      filtersRef.current.twist.offset.x = w * 0.4;
      filtersRef.current.twist.offset.y = h * 0.4;
      filtersRef.current.twist.radius = Math.max(w, h) * 0.9;
    }

    copies.forEach((copy) => {
      const baseDimension = Math.max(w, h);
      const size = baseDimension * copy.scaleMultiplier;
      copy.el.width = size;
      copy.el.height = size;
    });
  };
}

function animateCopies(copies: AlbumCopy[], effectsRef: React.MutableRefObject<EffectsState>) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  copies.forEach((copy) => {
    if (effectsRef.current.movement) {
      copy.el.rotation += copy.rotationSpeed;

      if (copy.isSmall) {
        copy.trackAngle += copy.trackSpeed;
      }
    }

    if (copy.isSmall) {
      const trackRadius = window.innerWidth * 0.2;
      copy.el.x = cx + Math.cos(copy.trackAngle) * trackRadius;
      copy.el.y = cy + Math.sin(copy.trackAngle) * trackRadius;
      return;
    }

    copy.el.x = cx;
    copy.el.y = cy;
  });
}

async function setupTextureScene({
  resolvedUrl,
  container,
  app,
  filtersRef,
  effectsRef,
  isDestroyed,
  setResizeHandler,
}: {
  resolvedUrl: string;
  container: PIXI.Container;
  app: PIXI.Application;
  filtersRef: React.MutableRefObject<FiltersRegistry>;
  effectsRef: React.MutableRefObject<EffectsState>;
  isDestroyed: () => boolean;
  setResizeHandler: (handler: () => void) => void;
}) {
  if (isDestroyed()) return;
  const texture = await loadTexture(resolvedUrl);
  if (!texture) return;
  if (isDestroyed()) return;

  const copies = createAlbumCopies(texture, container);
  const handleResizeFn = createResizeHandler(copies, filtersRef);

  window.addEventListener('resize', handleResizeFn);
  setResizeHandler(handleResizeFn);
  handleResizeFn();
  app.ticker.add(() => animateCopies(copies, effectsRef));
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ imageUrl }) => {
  const { resolvedUrl } = useResolveImageUrl(imageUrl, true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [effects, _setEffects] = useState<EffectsState>({
    blur: true,
    twist: true,
    color: true,
    movement: true,
  });

  const effectsRef = useRef(effects);
  const filtersRef = useRef<FiltersRegistry>({});

  useEffect(() => {
    effectsRef.current = effects;

    if (filtersRef.current.blur) filtersRef.current.blur.enabled = effects.blur;
    if (filtersRef.current.twist) filtersRef.current.twist.enabled = effects.twist;
    if (filtersRef.current.color) filtersRef.current.color.enabled = effects.color;
  }, [effects]);

  useEffect(() => {
    if (!resolvedUrl || resolvedUrl === '') return;

    const app = new PIXI.Application();
    let handleResizeFn: () => void;
    let isDestroyed = false;

    const initPixi = () => {
      void app
        .init({
          resizeTo: window,
          backgroundColor: 0x000000,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })
        .then(() => {
          if (isDestroyed) return;

          if (containerRef.current) {
            containerRef.current.appendChild(app.canvas);
          }

          const container = new PIXI.Container();
          app.stage.addChild(container);
          applyFilters(app, filtersRef, effectsRef);

          return setupTextureScene({
            resolvedUrl,
            container,
            app,
            filtersRef,
            effectsRef,
            isDestroyed: () => isDestroyed,
            setResizeHandler: (handler) => {
              handleResizeFn = handler;
            },
          });
        })
        .catch((error) => {
          console.error('Final error loading texture:', error);
        });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (handleResizeFn) window.removeEventListener('resize', handleResizeFn);

      try {
        if (app?.stage) app.destroy({ removeView: true }, { children: true });
      } catch (_e) {
        console.warn('Pixi destroy aborted due to error:', _e);
      }
    };
  }, [resolvedUrl]);

  // const toggleEffect = (key: keyof typeof effects) => {
  //   setEffects(prev => ({ ...prev, [key]: !prev[key] }));
  // };

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Debug Panel */}
      {/* <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <h4 style={{ margin: '0 0 5px 0' }}>Debug Panel</h4>
        
        {Object.entries(effects).map(([key, value]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={value} 
              onChange={() => toggleEffect(key as keyof typeof effects)}
              style={{ marginRight: '8px' }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div> */}
    </div>
  );
};

export default GradientBackground;
