// Builds the Trio ring icon as SVG. Outer = food, middle = habits, inner = workout (neon set).
const COLORS = ['#FF2D78', '#A6E22E', '#17C2FF'];
const R = [200, 134, 68];
const W = 58;
const ENDS = [290, 250, 320]; // how far round each ring is filled, in degrees

// scale < 1 shrinks the rings toward the centre (adaptive icons need a safe margin).
// mono = single white colour for Android's themed (monochrome) icon.
function trioSvg({ size = 1024, scale = 1, mono = false } = {}) {
  let s = '';
  R.forEach((r, i) => {
    const color = mono ? '#FFFFFF' : COLORS[i];
    s += `<circle cx="256" cy="256" r="${r}" fill="none" stroke="${mono ? '#FFFFFF' : '#808080'}" stroke-opacity="${mono ? 0.35 : 0.25}" stroke-width="${W}"/>`;
    const a = ((ENDS[i] - 90) * Math.PI) / 180;
    s += `<path d="M256 ${256 - r} A${r} ${r} 0 1 1 ${256 + r * Math.cos(a)} ${256 + r * Math.sin(a)}" fill="none" stroke="${color}" stroke-width="${W}" stroke-linecap="round"/>`;
  });
  const t = `translate(256 256) scale(${scale}) translate(-256 -256)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><g transform="${t}">${s}</g></svg>`;
}

module.exports = { trioSvg };
