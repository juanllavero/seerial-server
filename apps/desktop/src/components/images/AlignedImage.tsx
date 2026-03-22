import type React from 'react';
import { memo, useEffect, useState } from 'react';

const AlignedImage = ({
  imageUrl,
  height = 200,
  maxWidth = 800, // Un valor por defecto más razonable para web
  className,
}: {
  imageUrl: string;
  height?: number;
  maxWidth?: number;
  className?: string;
}) => {
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setIsLoaded(false); // Reinicia la animación si la imagen cambia
      const img = new window.Image(); // Crea un objeto imagen en memoria para obtener sus dimensiones
      img.src = imageUrl;
      img.onload = () => {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      };
    }
  }, [imageUrl]);

  // RN: La lógica de `width` y `height` se traduce a CSS.
  // El ancho del contenedor será 100% hasta el `maxWidth`.
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidth,
    height: Math.min(maxWidth / aspectRatio, height),
    display: 'flex',
    alignItems: 'flex-start',
  };

  const imageStyle: React.CSSProperties = {
    height: '100%',
    aspectRatio: aspectRatio.toString(),
    maxWidth: '100%',
    objectFit: 'contain', // RN: resizeMode: 'contain' -> Web: object-fit: 'contain'
    opacity: isLoaded ? 1 : 0, // Controla la opacidad según el estado de carga
    transition: 'opacity 400ms ease-in-out', // Animación con CSS
  };

  return (
    // RN: View -> Web: div
    <div className={className} style={containerStyle}>
      <img
        src={imageUrl} // RN: source={{ uri: ... }} -> Web: src="..."
        style={imageStyle}
        onLoad={() => setIsLoaded(true)} // Activa la animación cuando la imagen carga
        alt="" // Buena práctica para accesibilidad
      />
    </div>
  );
};

export default memo(AlignedImage);
