# LivePulse

> **Status: Development paused — resuming soon.**
> This project was on hold pending the release of AdonisJS v7, which just shipped. Active development is resuming.

Reactive UI components for [AdonisJS](https://adonisjs.com/) — powered by [Edge.js](https://edgejs.dev/) and [Alpine.js](https://alpinejs.dev/). Build interactive interfaces without writing frontend JavaScript. Inspired by [Laravel Livewire](https://livewire.laravel.com/).

---

## How it works

1. Define a `LivePulseComponent` class (backend) with state and actions
2. Render it in Edge templates with `@lp('component-name')`
3. Call backend actions from Alpine.js HTML using `$lp.actionName()`
4. LivePulse sends an AJAX request to `/lp/update`, re-renders the component, and morphs the DOM

No page reloads. No manual fetch calls. No frontend state management.

---

## Installation

```bash
npm install livepulse
# or
pnpm add livepulse
```

### Peer dependencies

```bash
pnpm add @adonisjs/core edge.js alpinejs @alpinejs/morph
```

---

## Setup

### 1. Register the provider

In `adonisrc.ts`:

```ts
import { defineConfig } from '@adonisjs/core/build/config'

export default defineConfig({
  providers: [
    // ...other providers
    () => import('livepulse/adonisjs/livepulse_provider'),
  ],
})
```

### 2. Include the client script

Add the LivePulse client bundle to your layout template. It registers the `$lp` Alpine.js magic automatically.

```html
<script src="/livepulse.iife.js" defer></script>
```

> The client bundle initializes Alpine.js and the `$lp` magic. Do **not** initialize Alpine.js separately.

---

## Creating a component

Place components in `app/controllers/livepulse/`. The file name must follow the pattern `{name}_livepulse.ts`.

```ts
// app/controllers/livepulse/counter_livepulse.ts
import { LivePulseComponent } from 'livepulse'
import type { HttpContext } from '@adonisjs/core/http'

export default class Counter extends LivePulseComponent {
  count = 0

  async init() {
    // runs before render — initialize state here
  }

  async increment() {
    this.count++
  }

  async decrement() {
    this.count = Math.max(0, this.count - 1)
  }

  async reset() {
    this.count = 0
  }

  async render(ctx: HttpContext) {
    return ctx.view.render('components/counter', { count: this.count })
  }
}
```

### Component template (`resources/views/components/counter.edge`)

```html
<div x-data="">
  <button @click="$lp.increment()">+</button>
  <button @click="$lp.decrement()">-</button>
  <button @click="$lp.reset()">Reset</button>
  <span x-text="'Count: ' + $lp.data.count"></span>
</div>
```

---

## Using in Edge templates

```html
{{-- resources/views/pages/home.edge --}}
@lp('counter')
```

The `@lp` tag renders the component and injects the required `lp:id` and `lp:snapshot` attributes automatically.

---

## Client API — `$lp` magic

The `$lp` Alpine.js magic is available inside any element with a `lp:id` attribute.

| Usage | Description |
|---|---|
| `$lp.data.property` | Read reactive state |
| `$lp.data.property = value` | Write reactive state (local only) |
| `$lp.actionName(...args)` | Call a backend action |

Backend action calls:
- POST to `/lp/update` with the current snapshot
- Re-render the component server-side
- Morph the DOM with the new HTML
- Merge updated data back into Alpine reactive state

---

## Component lifecycle

| Method | When it runs |
|---|---|
| `init()` | Before every render (initial + updates) |
| `render(ctx)` | Returns the component HTML string |

---

## Security

- Only **public** methods (not prefixed with `_`) can be called from the client
- CSRF token is read from the request and embedded in the snapshot

---

## Example

See [`example.html`](./example.html) for a self-contained demo with counter, form, and todo list components (mocked backend).

---

## TypeScript types

```ts
import type { LivePulsePayload, LivePulseResponse } from 'livepulse'
```

| Type | Description |
|---|---|
| `LivePulsePayload` | Incoming request payload (`action`, `args`, `snapshot`) |
| `LivePulseResponse` | Response from the update route (`html`, `data`, `success`) |

---

## Repository

- GitHub: [github.com/sbsouhail/livepulse](https://github.com/sbsouhail/livepulse)
- Issues: [github.com/sbsouhail/livepulse/issues](https://github.com/sbsouhail/livepulse/issues)

## License

MIT — [Souhail SBOUI](https://github.com/sbsouhail)
