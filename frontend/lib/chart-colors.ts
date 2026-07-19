/**
 * Validated categorical/status chart palette (dataviz skill reference
 * instance). Fixed hue order — never cycled or reassigned by rank. Kept
 * separate from the UI chrome palette (globals.css --primary etc).
 */
export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#1fae1f",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
] as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export function categoricalPalette(mode: "light" | "dark") {
  return mode === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

export function categoricalColor(index: number, mode: "light" | "dark") {
  const palette = categoricalPalette(mode);
  return palette[index % palette.length];
}
