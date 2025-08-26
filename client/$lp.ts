import { Alpine } from 'alpinejs'

const proxies = new Map<string, any>()

export function initLP(AlpineInstance: Alpine) {
  // Register magic property
  AlpineInstance.magic('lp', (el: Element) => {
    const id = el.closest('[lp\\:id]')?.getAttribute('lp:id')
    return id && proxies.has(id) ? proxies.get(id) : {}
  })

  // Initialize proxies for elements with lp:id
  document.querySelectorAll('[lp\\:id]').forEach((el) => {
    const id = el.getAttribute('lp:id')!
    if (!proxies.has(id)) {
      const data = el.getAttribute('lp:snapshot')
      proxies.set(id, createProxy(data ? parseSnapshot(data) : {}, AlpineInstance))
      el.removeAttribute('lp:snapshot')
    }
  })
}

function parseSnapshot(snapshot: string) {
  try {
    return JSON.parse(atob(snapshot))
  } catch (e) {
    console.error('Invalid lp:snapshot:', e)
    return {}
  }
}

function createProxy(data: Record<string, any>, AlpineInstance: Alpine) {
  // Make the data reactive
  const reactiveData = AlpineInstance.reactive(data)
  return new Proxy(reactiveData, {
    get(target, property) {
      const prop = property.toString()

      // Handle nested properties
      if (prop.includes('.')) {
        return prop
          .split('.')
          .reduce((obj, key) => (obj && key in obj ? obj[key] : undefined), target)
      }

      if (prop in target) return target[prop]

      // Assume backend method
      return (...args: any[]) => console.log(`Calling backend action: ${prop}`, args)
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
        console.log(`Updated nested property ${prop} to`, value)
        return true
      }

      if (!(prop in target)) {
        console.error(`Cannot set value. Property "${prop}" does not exist.`)
        return false
      }

      target[prop] = value
      console.log(`Updated ${prop} to`, value)
      return true
    },
  })
}
