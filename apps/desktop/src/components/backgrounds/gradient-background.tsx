import * as PIXI from "pixi.js";
import { KawaseBlurFilter, TwistFilter } from "pixi-filters";
import React, { useEffect, useRef, useState } from "react";
import { useResolveImageUrl } from "@/hooks/use-resolve-image-url";

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

const GradientBackground: React.FC<GradientBackgroundProps> = ({
	imageUrl,
}) => {
	const { resolvedUrl } = useResolveImageUrl(imageUrl, true);
	const containerRef = useRef<HTMLDivElement>(null);

	const [effects, setEffects] = useState({
		blur: true,
		twist: true,
		color: true,
		movement: true,
	});

	const effectsRef = useRef(effects);
	const filtersRef = useRef<{
		blur?: KawaseBlurFilter;
		twist?: TwistFilter;
		color?: PIXI.ColorMatrixFilter;
	}>({});

	useEffect(() => {
		effectsRef.current = effects;

		if (filtersRef.current.blur) filtersRef.current.blur.enabled = effects.blur;
		if (filtersRef.current.twist)
			filtersRef.current.twist.enabled = effects.twist;
		if (filtersRef.current.color)
			filtersRef.current.color.enabled = effects.color;
	}, [effects]);

	useEffect(() => {
		if (!resolvedUrl || resolvedUrl === "") return;

		const app = new PIXI.Application();
		const copies: AlbumCopy[] = [];
		let handleResizeFn: () => void;
		let isDestroyed = false;

		const initPixi = async () => {
			await app.init({
				resizeTo: window,
				backgroundColor: 0x000000,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
			});

			if (isDestroyed) return;

			if (containerRef.current) {
				containerRef.current.appendChild(app.canvas);
			}

			const container = new PIXI.Container();
			app.stage.addChild(container);

			// --- Color Adjustment ---
			filtersRef.current.color = new PIXI.ColorMatrixFilter();
			filtersRef.current.color.saturate(1.4, false);
			filtersRef.current.color.enabled = effectsRef.current.color;

			// --- Twist Effect ---
			filtersRef.current.twist = new TwistFilter({
				radius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
				angle: 3.5,
				padding: 0,
				offset: new PIXI.Point(
					window.innerWidth * 0.4,
					window.innerHeight * 0.4,
				),
			});
			filtersRef.current.twist.enabled = effectsRef.current.twist;

			filtersRef.current.blur = new KawaseBlurFilter({
				strength: 60,
				quality: 12,
				clamp: true,
			});
			filtersRef.current.blur.enabled = effectsRef.current.blur;

			app.stage.filters = [
				filtersRef.current.color,
				filtersRef.current.twist,
				filtersRef.current.blur,
			];

			try {
				let texture: PIXI.Texture | null = null;

				// Try to load with Pixi's built-in loader first, which can handle more formats and is optimized for WebGL.
				try {
					const loaded = await PIXI.Assets.load(resolvedUrl);
					if (loaded?.source) texture = loaded;
				} catch (_e) {
					console.warn(
						"PixiJS no pudo parsear la URL, usando método nativo fallback...",
					);
				}

				// If Pixi returned null (due to missing extension, temporary blob, etc), use HTML5 Image
				if (!texture) {
					const img = new Image();
					img.crossOrigin = "anonymous";
					img.src = resolvedUrl;
					await new Promise((resolve, reject) => {
						img.onload = resolve;
						img.onerror = reject;
					});

					// --- Downscale image using canvas before creating Pixi texture ---
					const targetSize = 300; // px, you can adjust this value
					const scale = Math.min(
						targetSize / img.width,
						targetSize / img.height,
						1,
					);
					const canvas = document.createElement("canvas");
					canvas.width = Math.round(img.width * scale);
					canvas.height = Math.round(img.height * scale);
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
						texture = PIXI.Texture.from(canvas);
					} else {
						// fallback if canvas context fails
						texture = PIXI.Texture.from(img);
					}
				}

				// --- Safety Lock: If React destroyed the component,
				// or if even the fallback failed, do not continue.
				if (isDestroyed || !texture) return;

				// --- Black Zone Fix ---
				const scaleMultipliers: number[] = [2.0, 1.25, 0.8, 0.5, 0.25];

				scaleMultipliers.forEach((scale: number, index: number) => {
					// Since we now ensure that texture exists, this will never throw "null (reading 'texture')"
					const sprite = new PIXI.Sprite(texture!);
					sprite.anchor.set(0.5);

					// --- Transparency and Excessive Light Fix ---
					sprite.blendMode = "normal";
					sprite.alpha = 1;

					container.addChild(sprite);

					copies.push({
						el: sprite,
						scaleMultiplier: scale,
						isSmall: index >= 3,
						trackAngle: Math.random() * Math.PI * 2,
						rotationSpeed: (Math.random() - 0.5) * 0.004,
						trackSpeed: (Math.random() - 0.5) * 0.002,
					});
				});

				handleResizeFn = () => {
					const w = window.innerWidth;
					const h = window.innerHeight;

					if (filtersRef.current.twist) {
						filtersRef.current.twist.offset.x = w * 0.4;
						filtersRef.current.twist.offset.y = h * 0.4;
						filtersRef.current.twist.radius = Math.max(w, h) * 0.9;
					}

					copies.forEach((copy: AlbumCopy) => {
						const baseDimension = Math.max(w, h);
						const size = baseDimension * copy.scaleMultiplier;
						copy.el.width = size;
						copy.el.height = size;
					});
				};

				window.addEventListener("resize", handleResizeFn);
				handleResizeFn();

				app.ticker.add(() => {
					const cx = window.innerWidth / 2;
					const cy = window.innerHeight / 2;

					copies.forEach((copy: AlbumCopy) => {
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
						} else {
							copy.el.x = cx;
							copy.el.y = cy;
						}
					});
				});
			} catch (error) {
				console.error("Final error loading texture:", error);
			}
		};

		initPixi();

		return () => {
			isDestroyed = true;
			if (handleResizeFn) window.removeEventListener("resize", handleResizeFn);

			try {
				if (app?.stage) app.destroy({ removeView: true }, { children: true });
			} catch (_e) {
				console.warn("Pixi destroy aborted due to error:", _e);
			}
		};
	}, [resolvedUrl]);

	// const toggleEffect = (key: keyof typeof effects) => {
	//   setEffects(prev => ({ ...prev, [key]: !prev[key] }));
	// };

	return (
		<div
			style={{
				position: "absolute",
				width: "100%",
				height: "100vh",
				overflow: "hidden",
			}}
		>
			<div
				ref={containerRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					transform: "scaleX(-1)",
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
