const ICONS = {
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  warn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
}

let toastCount = 0

export function mountToast(host, type, message, duration = 5000, opts = {}) {
  if (!host) return

  const { action = null, description = '' } = opts
  toastCount++
  const id = `toast-${toastCount}`

  const toast = document.createElement('div')
  toast.id = id
  toast.className = `toast toast--${type}`
  toast.setAttribute('role', 'alert')
  toast.innerHTML = `
    <div class="toast__icon">${ICONS[type] ?? ICONS.info}</div>
    <div class="toast__content">
      <p class="toast__message">${message}</p>
      ${description ? `<p class="toast__description">${description}</p>` : ''}
    </div>
    <div class="toast__actions">
      ${action ? `<button class="toast__action" data-action="true" type="button">${action.label}</button>` : ''}
      <button class="toast__close" aria-label="Cerrar" type="button">×</button>
    </div>
  `

  toast.querySelector('.toast__close')?.addEventListener('click', () => dismissToast(id, host))
  toast.querySelector('[data-action]')?.addEventListener('click', () => {
    action?.onClick?.()
    dismissToast(id, host)
  })

  host.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('toast--visible'))

  if (duration > 0) {
    setTimeout(() => dismissToast(id, host), duration)
  }

  return id
}

function dismissToast(id, host) {
  const toast = document.getElementById(id)
  if (!toast) return
  toast.classList.remove('toast--visible')
  toast.classList.add('toast--exiting')
  setTimeout(() => toast.remove(), 200)
}

export function dismissAllToasts(host) {
  if (!host) return
  host.querySelectorAll('.toast').forEach((t) => {
    t.classList.remove('toast--visible')
    t.classList.add('toast--exiting')
    setTimeout(() => t.remove(), 200)
  })
}