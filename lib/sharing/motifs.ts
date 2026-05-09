const TWO_PI = Math.PI * 2;

export function drawMikekaTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const hw = width / 2;
  const hh = height / 2;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Top chevron (filled)
  ctx.beginPath();
  ctx.moveTo(0, hh);
  ctx.lineTo(hw, 0);
  ctx.lineTo(width, hh);
  ctx.closePath();
  ctx.fill();

  // Bottom chevron (outlined)
  ctx.beginPath();
  ctx.moveTo(0, hh);
  ctx.lineTo(hw, height);
  ctx.lineTo(width, hh);
  ctx.closePath();
  ctx.stroke();
}

export function drawDoorFrameTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const cx = width / 2;
  const cy = height / 2;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  // Outer rectangle
  ctx.strokeRect(pad, pad, innerW, innerH);

  // Inner diamond
  const dw = innerW * 0.35;
  const dh = innerH * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dh);
  ctx.lineTo(cx + dw, cy);
  ctx.lineTo(cx, cy + dh);
  ctx.lineTo(cx - dw, cy);
  ctx.closePath();
  ctx.fill();
}

export function drawVigangoTile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height * 0.75);
}

export function createMotifPattern(
  ctx: CanvasRenderingContext2D,
  drawTile: (tileCtx: CanvasRenderingContext2D, w: number, h: number, color: string) => void,
  tileWidth: number,
  tileHeight: number,
  color: string
): CanvasPattern {
  const tile = document.createElement('canvas');
  tile.width = tileWidth;
  tile.height = tileHeight;
  const tileCtx = tile.getContext('2d')!;
  drawTile(tileCtx, tileWidth, tileHeight, color);
  return ctx.createPattern(tile, 'repeat')!;
}
