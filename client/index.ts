import Alpine from 'alpinejs'

window.Alpine = Alpine

document.addEventListener('alpine:init', () => {
  console.log('Hello from Alpine!')
})

Alpine.start()
console.log('Hello from the client!!!')
