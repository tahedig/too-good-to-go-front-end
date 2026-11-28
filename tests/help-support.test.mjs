import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let HelpSupportPage
let ProfilePageSource

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ default: HelpSupportPage } = await vite.ssrLoadModule('/src/pages/HelpSupportPage.tsx'))
  ProfilePageSource = await fs.readFile(
    new URL('../src/pages/ProfilePage.tsx', import.meta.url),
    'utf8',
  )
})

after(async () => {
  await vite?.close()
})

test('HelpSupportPage renders all collapsed FAQs, header, back link, and support form', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/profile/support'] },
      React.createElement(HelpSupportPage),
    ),
  )

  assert.match(html, /راهنمایی و پشتیبانی/)
  assert.match(html, /پرسش‌های متداول/)
  assert.match(html, /چطور بسته را رزرو کنم؟/)
  assert.match(html, /برای دریافت بسته چه همراه داشته باشم؟/)
  assert.match(html, /چطور رزرو را لغو کنم؟/)
  assert.match(html, /چطور اطلاعات حساب را تغییر دهم؟/)
  assert.match(html, /پیام به پشتیبانی/)
  assert.match(html, /سؤالتان را بنویسید/)
  assert.match(html, /ارسال پیام/)
  assert.match(html, /href="\/profile"/)
  assert.doesNotMatch(html, /ناوبری بخش‌های مشتری/)

  // All FAQ triggers must start collapsed (`aria-expanded="false"`).
  const expandedCount = (html.match(/aria-expanded="true"/g) ?? []).length
  const collapsedCount = (html.match(/aria-expanded="false"/g) ?? []).length
  assert.equal(expandedCount, 0)
  assert.equal(collapsedCount, 4)
})

test('ProfilePage links Help and Support directly to /profile/support', () => {
  assert.match(ProfilePageSource, /to="\/profile\/support"/)
})
