import { Line, Triangle, Group } from 'fabric';

interface ArrowOptions {
  color?: string;
  strokeWidth?: number;
  headSize?: number;
}

/**
 * 创建一个从 start 到 end 的箭头 (Line + Triangle head)
 */
export function createArrow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: ArrowOptions = {}
): Group {
  const {
    color = '#333333',
    strokeWidth = 2,
    headSize = 10,
  } = options;

  // Main line
  const line = new Line([startX, startY, endX, endY], {
    stroke: color,
    strokeWidth,
    selectable: false,
    evented: false,
  });

  // Arrow head — triangle at the end point
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  const head = new Triangle({
    left: endX,
    top: endY,
    width: headSize,
    height: headSize,
    fill: color,
    angle: angle + 90,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  const group = new Group([line, head], {
    selectable: false,
    evented: false,
    objectCaching: false,
  });

  return group;
}
