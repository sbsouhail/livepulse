export async function callBackend(snapshot: Record<string, any>, action: string, args: any[]) {
  const csrfToken = document.querySelector('script[csrfToken]')?.getAttribute('csrfToken') || ''

  try {
    const response = await fetch(`/lp/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
      },
      body: JSON.stringify({
        snapshot: btoa(JSON.stringify(snapshot)),
        action,
        args,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return await response.json()
    /*{
      html: `<div x-data="" lp:id="1">    <button @click="$lp.count++" x-text="$lp.count +' clicks'">5 clicks</button>  </div>`,
      data: { count: 50 },
    }*/
  } catch (err) {
    console.error(`Failed to call backend action "${action}"`, err)
    return null
  }
}
