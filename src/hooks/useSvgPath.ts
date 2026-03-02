import { useMemo } from 'react';
import { getPathCurve } from '../utils/pathParser';

export function useSvgPath(numSamples: number = 1500) {
  const curve = useMemo(() => {
    return getPathCurve(numSamples);
  }, [numSamples]);

  const pathLength = useMemo(() => curve.getLength(), [curve]);

  return { curve, pathLength };
}
