import { useCallback, useRef } from 'react';

export function DropZoneOverlay({ engineRef, onPositionChange, onDrop }) {
  const overlayRef = useRef(null);

  const getWorldX = useCallback((e) => {
    if (!engineRef?.current) return null;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return engineRef.current.screenToWorldX(clientX, clientY);
  }, [engineRef]);

  const handleMove = useCallback((e) => {
    e.preventDefault();
    const x = getWorldX(e);
    if (x !== null) onPositionChange(x);
  }, [getWorldX, onPositionChange]);

  const handleDrop = useCallback((e) => {
    const x = getWorldX(e);
    if (x !== null) onPositionChange(x);
    onDrop();
  }, [getWorldX, onPositionChange, onDrop]);

  return (
    <div
      ref={overlayRef}
      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      onMouseMove={handleMove}
      onClick={handleDrop}
      onTouchMove={handleMove}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleDrop(e);
      }}
    />
  );
}
