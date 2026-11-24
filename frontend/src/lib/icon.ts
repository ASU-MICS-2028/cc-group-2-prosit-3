import { createElement, type IconNode } from 'lucide'

/** Turns a Lucide icon into an SVG string (used inside map markers and v-html). */
export function iconSvg(node: IconNode, size = 16, strokeWidth = 1.5): string {
  return createElement(node, { width: size, height: size, 'stroke-width': strokeWidth }).outerHTML
}
