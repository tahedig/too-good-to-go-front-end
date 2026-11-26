import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let UserLayout
let HomePage
let OfferCollectionPage
let OrdersPage
let PublicStorePage
let ProfilePage
let PersonalInfoPage
let HelpSupportPage

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ default: UserLayout } = await vite.ssrLoadModule('/src/layouts/UserLayout.tsx'))
  ;({ default: HomePage } = await vite.ssrLoadModule('/src/pages/HomePage.tsx'))
  ;({ default: OfferCollectionPage } = await vite.ssrLoadModule(
    '/src/pages/OfferCollectionPage.tsx',
  ))
  ;({ default: OrdersPage } = await vite.ssrLoadModule('/src/pages/OrdersPage.tsx'))
  ;({ default: PublicStorePage } = await vite.ssrLoadModule('/src/pages/PublicStorePage.tsx'))
  ;({ default: ProfilePage } = await vite.ssrLoadModule('/src/pages/ProfilePage.tsx'))
  ;({ default: PersonalInfoPage } = await vite.ssrLoadModule('/src/pages/PersonalInfoPage.tsx'))
  ;({ default: HelpSupportPage } = await vite.ssrLoadModule('/src/pages/HelpSupportPage.tsx'))
})

after(async () => {
  await vite?.close()
})

function renderCustomerRoute(initialEntry) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      React.createElement(
        Routes,
        null,
        React.createElement(
          Route,
          { path: '/', element: React.createElement(UserLayout) },
          React.createElement(Route, { index: true, element: React.createElement(HomePage) }),
          React.createElement(Route, {
            path: 'favorites',
            element: React.createElement(OfferCollectionPage),
          }),
          React.createElement(Route, { path: 'orders', element: React.createElement(OrdersPage) }),
          React.createElement(Route, {
            path: 'stores/:storeId',
            element: React.createElement(PublicStorePage),
          }),
          React.createElement(Route, {
            path: 'profile',
            element: React.createElement(ProfilePage),
          }),
          React.createElement(Route, {
            path: 'profile/personal',
            element: React.createElement(PersonalInfoPage),
          }),
          React.createElement(Route, {
            path: 'profile/support',
            element: React.createElement(HelpSupportPage),
          }),
        ),
      ),
    ),
  )
}

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length
}

function hasActiveNavLink(html, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const links = html.match(/<a\b[^>]*>/g) ?? []
  return links.some(
    (tag) => new RegExp(`\\bhref="${escaped}"`).test(tag) && /\baria-current="page"/.test(tag),
  )
}

test('UserLayout prioritizes primary sidebar and links Profile directly to /profile', () => {
  const html = renderCustomerRoute('/profile')

  assert.equal(countMatches(html, /<aside\b/g), 1)
  assert.equal(countMatches(html, /aria-label="ناوبری مشتری"/g), 2)
  assert.equal(countMatches(html, /aria-label="ناوبری پایین"/g), 0)
  assert.equal(hasActiveNavLink(html, '/profile'), true)
  assert.doesNotMatch(html, /href="\/login"[^>]*>.*پروفایل/)
})

test('Customer routes render only UserLayout sidebar without duplicate sidebars or top navbars', () => {
  for (const route of ['/favorites', '/orders', '/stores/morning-bakery', '/profile/personal']) {
    const html = renderCustomerRoute(route)
    assert.equal(countMatches(html, /<aside\b/g), 1, `expected single aside on ${route}`)
    assert.equal(
      countMatches(html, /aria-label="ناوبری مشتری"/g),
      2,
      `expected single desktop+mobile UserLayout nav pair on ${route}`,
    )
    assert.equal(
      countMatches(html, /aria-label="ناوبری پایین"/g),
      0,
      `expected no duplicate bottom nav on ${route}`,
    )
  }

  const homeHtml = renderCustomerRoute('/')
  assert.equal(countMatches(homeHtml, /<aside\b/g), 1)
  assert.equal(countMatches(homeHtml, /aria-label="ناوبری اصلی"/g), 0)

  const storeHtml = renderCustomerRoute('/stores/morning-bakery')
  assert.equal(hasActiveNavLink(storeHtml, '/'), true)

  const favoritesHtml = renderCustomerRoute('/favorites')
  assert.match(favoritesHtml, /باز کردن فیلترها/)
  assert.match(favoritesHtml, /محبوب‌های اطراف/)
})

test('HelpSupportPage inside UserLayout omits redundant desktop header nav tabs', () => {
  const html = renderCustomerRoute('/profile/support')

  assert.equal(countMatches(html, /aria-label="ناوبری مشتری"/g), 2)
  assert.doesNotMatch(html, /aria-label="ناوبری بخش‌های مشتری"/)
  assert.equal(hasActiveNavLink(html, '/profile'), true)
  assert.match(html, /راهنمایی و پشتیبانی/)
})
