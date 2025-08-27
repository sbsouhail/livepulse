import { Alpine } from 'alpinejs'
import { callBackend } from './lp_request.js'
import { applyMorph } from './lp_morph.js'

const proxies = new Map<string, any>()

export function initLP(AlpineInstance: Alpine) {
  AlpineInstance.magic('lp', (el: Element) => {
    const id = el.closest('[lp\\:id]')?.getAttribute('lp:id')
    return id && proxies.has(id) ? proxies.get(id) : {}
  })

  document.querySelectorAll('[lp\\:id]').forEach((el) => {
    const id = el.getAttribute('lp:id')!
    if (!proxies.has(id)) {
      const data = el.getAttribute('lp:snapshot')
      proxies.set(id, createProxy(el, data ? parseSnapshot(data, id) : {}, AlpineInstance))
      el.removeAttribute('lp:snapshot')
    }
  })
}

function parseSnapshot(snapshot: string, id: string) {
  try {
    const data = JSON.parse(atob(snapshot))
    return { ...data, lp_meta: { ...data.lp_meta, id } }
  } catch (e) {
    console.error('Invalid lp:snapshot:', e)
    return {}
  }
}

function createProxy(el: Element, data: Record<string, any>, AlpineInstance: Alpine) {
  const reactiveData = AlpineInstance.reactive(data)

  return new Proxy(reactiveData, {
    get(target, property) {
      const prop = property.toString()

      if (prop.includes('.')) {
        return prop
          .split('.')
          .reduce((obj, key) => (obj && key in obj ? obj[key] : undefined), target)
      }

      if (prop in target) return target[prop]

      // Backend method call
      return async (...args: any[]) => {
        console.log(`Calling backend action: ${prop}`, args)
        const result = await callBackend(target, prop, args)
        if (result) {
          if (result.html) applyMorph(el, result.html, AlpineInstance)
          if (result.data) Object.assign(target, result.data)
        }
      }
    },

    set(target, property, value) {
      const prop = property.toString()

      if (prop.includes('.')) {
        const keys = prop.split('.')
        let obj: any = target

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (!(key in obj)) {
            console.error(
              `Cannot set value. Path "${keys.slice(0, i + 1).join('.')}" does not exist.`
            )
            return false
          }
          obj = obj[key]
        }

        const lastKey = keys[keys.length - 1]
        if (!(lastKey in obj)) {
          console.error(`Cannot set value. Property "${lastKey}" does not exist.`)
          return false
        }

        obj[lastKey] = value
        return true
      }

      if (!(prop in target)) {
        console.error(`Cannot set value. Property "${prop}" does not exist.`)
        return false
      }

      target[prop] = value
      return true
    },
  })
}
