import type React from "react";
import { type ImgHTMLAttributes, useEffect, useState } from "react";

// Se usan los atributos de la etiqueta <img> de HTML
interface AnimatedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
	uri: string | null | undefined;
	style?: React.CSSProperties;
	duration?: number;
}

export function AnimatedImage({
	uri,
	style,
	duration = 500,
	...rest
}: AnimatedImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Dependency is intentionally left out to only reset on URI change>
	useEffect(() => {
		// Cuando la URI cambia, reseteamos el estado de carga para
		// que la nueva imagen también tenga su animación.
		setIsLoaded(false);
	}, [uri]);

	if (!uri) {
		return null;
	}

	const combinedStyle: React.CSSProperties = {
		...style,
		opacity: isLoaded ? 1 : 0,
		transition: `opacity ${duration}ms ease-in-out`,
	};

	return (
		<img
			src={uri}
			onLoad={() => setIsLoaded(true)}
			style={combinedStyle}
			{...rest}
			alt={rest.alt || ""} // Asegurar que alt siempre esté presente
		/>
	);
}
