import { useMemo } from 'react';
import { getPathCurve } from '../utils/pathParser';

export function useSvgPath() {
  const curve = useMemo(() => {
    return getPathCurve();
  }, []);

  const pathLength = useMemo(() => curve.getLength(), [curve]);

  return { curve, pathLength };
}
