import { useState, useCallback, useRef } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import type { CameraControllerRef } from './components/CameraController';
import './App.css';

function App() {
  const [isAnimating, setIsAnimating] = useState(false);
  const cameraControllerRef = useRef<CameraControllerRef | null>(null);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    cameraControllerRef.current?.reset();
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating((prev) => !prev);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene isAnimating={isAnimating} cameraControllerRef={cameraControllerRef} />
      <UIOverlay
        onReset={handleReset}
        onToggleAnimation={toggleAnimation}
        isAnimating={isAnimating}
      />
    </div>
  );
}

export default App;
