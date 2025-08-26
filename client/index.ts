import Alpine from 'alpinejs'
import { initLP } from './$lp.js'

// declare global {
//   interface Window {
//     Alpine: typeof Alpine
//   }
// }

// window.Alpine = Alpine

// Register $lp magic before Alpine starts
Alpine.plugin((AlpineInstance) => {
  initLP(AlpineInstance)
})

Alpine.start()

console.log('Alpine started with $lp support')
