// ============================================================
// opencode-onboard landing — copy buttons, terminal animation,
// scroll reveals
// ============================================================

// ---------- Copy buttons ----------
document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy)
      btn.classList.add('copied')
      setTimeout(() => btn.classList.remove('copied'), 2000)
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — ignore */
    }
  })
})

// ---------- Scroll reveal ----------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          revealObserver.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12 }
  )
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
}

// ---------- Terminal typing animation ----------
// Each line: [cssClass, text, perCharDelayMs]. null class = plain text.
const LINES = [
  ['t-prompt', '$ ', 0],
  [null, 'npx opencode-onboard@latest', 34],
  ['br', '', 0],
  ['br', '', 0],
  ['t-accent', '🧰 opencode-onboard', 8],
  ['br', '', 0],
  ['t-dim', '   Prepare any codebase for AI\n\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Source scope — current repo\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Clean AI files — 3 stale files removed\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Platform — GitHub backlog + GitHub repo\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Platform CLI — gh authenticated\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Scaffolding — agents, skills & commands copied\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'OpenSpec — initialized\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Models — plan / build / fast selected\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Token optimization — ob-global rules injected\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Browser plugin — installed\n', 4],
  ['t-ok', '  ✔ ', 0],
  [null, 'Metadata — .opencode/opencode-onboard.json written\n\n', 4],
  ['t-accent', '  ✨ Your codebase is ready for AI.\n', 12],
  ['t-dim', '  Open OpenCode and type ', 8],
  ['t-accent', '/ob-init', 40],
  ['t-dim', ' to activate the agent team.\n', 8],
]

const terminalBody = document.getElementById('terminal-body')

function runTerminal() {
  const cursor = document.createElement('span')
  cursor.className = 't-cursor'
  terminalBody.appendChild(cursor)

  let lineIdx = 0

  function nextLine() {
    if (lineIdx >= LINES.length) return

    const [cls, text, delay] = LINES[lineIdx++]

    if (cls === 'br') {
      cursor.insertAdjacentText('beforebegin', '\n')
      nextLine()
      return
    }

    const span = document.createElement('span')
    if (cls) span.className = cls
    cursor.insertAdjacentElement('beforebegin', span)

    if (delay === 0 || reduceMotion) {
      span.textContent = text
      nextLine()
      return
    }

    let charIdx = 0
    const timer = setInterval(() => {
      span.textContent += text[charIdx++]
      if (charIdx >= text.length) {
        clearInterval(timer)
        nextLine()
      }
    }, delay)
  }

  nextLine()
}

if (terminalBody) {
  if ('IntersectionObserver' in window) {
    const terminalObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          terminalObserver.disconnect()
          runTerminal()
        }
      },
      { threshold: 0.3 }
    )
    terminalObserver.observe(terminalBody)
  } else {
    runTerminal()
  }
}
