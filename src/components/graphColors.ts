// Bảng màu định danh cho các màu tô (đủ 10 màu cho n ≤ 10 đỉnh).
export const MAP_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

export const mapColor = (c: number): string =>
  MAP_COLORS[((c - 1) % MAP_COLORS.length + MAP_COLORS.length) % MAP_COLORS.length];

/** Chữ đọc được trên nền màu tô (trắng hoặc than). */
export const textOnMapColor = (hex: string): string => {
  const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const lum = (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255;
  return lum > 0.6 ? '#24303a' : '#ffffff';
};
