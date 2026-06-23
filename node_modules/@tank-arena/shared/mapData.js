// 35x35 tile grid. 0 = wall, 1 = floor, 2 = floor (alt color, inner ring)
// Ellipse centre (17, 17), outer radii (15, 15), inner radii (9, 9)
function buildOvalMap() {
  const rows = 35, cols = 35;
  const map = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const inEllipse = Math.pow((c - 17) / 15, 2) + Math.pow((r - 17) / 15, 2) <= 1;
      const inner     = Math.pow((c - 17) /  9, 2) + Math.pow((r - 17) /  9, 2) <= 1;
      row.push(inEllipse ? (inner ? 2 : 1) : 0);
    }
    map.push(row);
  }
  return map;
}

export const OVAL_MAP = buildOvalMap();
