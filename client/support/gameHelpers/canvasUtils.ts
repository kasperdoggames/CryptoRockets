declare global {
  interface Window {
    ethereum: any;
  }
}

export const cutArea = (
  fromImage: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const cut = document.createElement("canvas");
  cut.width = width;
  cut.height = height;
  const ctx = cut.getContext("2d");
  if (ctx) {
    ctx.drawImage(fromImage, -x, -y);
    return cut;
  }
};

export const splitImageParts = (img: HTMLImageElement) => {
  const cone = cutArea(img, 0, 0, 600, 135);
  const middle = cutArea(img, 0, 135, 600, 275);
  const end = cutArea(img, 0, 410, 600, 200);
  return [cone, middle, end];
};

export const roundRect = (
  ctx: CanvasRenderingContext2D,
  startx: number,
  startY: number,
  endX: number,
  endY: number
) => {
  ctx.beginPath();
  ctx.moveTo(startx, startY);
  ctx.arcTo(endX, startY, endX, endY, 10);
  ctx.arcTo(endX, endY, startx, endY, 10);
  ctx.arcTo(startx, endY, startx, startY, 10);
  ctx.arcTo(startx, startY, endX, startY, 10);
  ctx.closePath();
  ctx.fill();
};

export const setBackgroundAlpha = (rocketHeight: number) => {
  let backgroundAlpha = 1;
  const heightMarker = Array.from({ length: 500 }, (_, i) => i + 1000);
  const vals = Array.from({ length: 500 }, (_, i) =>
    parseFloat(`${i * 0.001}`).toFixed(1)
  ).reverse();

  heightMarker.map((heightMarker, index) => {
    if (rocketHeight > heightMarker) {
      backgroundAlpha = Number(vals[index]);
    }
  });
  return backgroundAlpha;
};
