import { Alpine } from 'alpinejs'

export function applyMorph(targetEl: Element, newHtml: string, AlpineInstance: Alpine) {
  AlpineInstance.morph(targetEl, newHtml)
}
