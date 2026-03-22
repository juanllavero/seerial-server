import { invoke } from '@tauri-apps/api/core';
import { memo, useState } from 'react';

function Settings() {
  const [zoom, setZoom] = useState(0);
  const handleZoomChange = async (zoomLevel: number) => {
    setZoom(zoomLevel);
    await invoke('set_zoom', { zoomLevel }).catch(console.error);
  };
  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <label>Zoom: </label>
        <input
          type="range"
          min={-3}
          max={5}
          step={0.1}
          value={zoom}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
        />
        <span> {zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
}

export default memo(Settings);
