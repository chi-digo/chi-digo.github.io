export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  const fontSize = Math.round(width * 0.06);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = '#000';
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('chidigo.com', 0, 0);
  ctx.restore();
}
