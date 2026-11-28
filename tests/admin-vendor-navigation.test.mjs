import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let AdminLayout

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ default: AdminLayout } = await vite.ssrLoadModule('/src/layouts/AdminLayout.tsx'))
})

after(async () => {
  await vite?.close()
})

function renderLayoutRoute(Layout, routePattern, initialEntry) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: routePattern,
          element: React.createElement(Layout),
        }),
      ),
    ),
  )
}

function hasActiveLink(html, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const links = html.match(/<a\b[^>]*>/g) ?? []
  return links.some(
    (tag) =>
      new RegExp(`\\bhref="${escaped}"`).test(tag) &&
      /\baria-current="page"/.test(tag) &&
      /\bbg-surface-sage\b/.test(tag),
  )
}

test('AdminLayout highlights Dashboard sidebar item on /admin, /admin/, and /admin/dashboard', () => {
  for (const path of ['/admin', '/admin/', '/admin/dashboard']) {
    const html = renderLayoutRoute(AdminLayout, '/admin/*', path)
    assert.equal(hasActiveLink(html, '/admin'), true, `expected Dashboard active on ${path}`)
    assert.equal(hasActiveLink(html, '/admin/stores'), false, `expected Stores inactive on ${path}`)
    assert.match(html, /داشبورد/)
  }

  const storesHtml = renderLayoutRoute(AdminLayout, '/admin/*', '/admin/stores/')
  assert.equal(hasActiveLink(storesHtml, '/admin'), false)
  assert.equal(hasActiveLink(storesHtml, '/admin/stores'), true)
})
