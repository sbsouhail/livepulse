import Alpine from 'alpinejs'
import { initLP } from './$lp.js'
import morph from '@alpinejs/morph'

Alpine.plugin(morph as any)

Alpine.plugin((AlpineInstance) => {
  initLP(AlpineInstance)
})

Alpine.start()
