import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let vendorAuthApi
let verifyOtpService
let logoutService
let profileApi
let VendorLoginPage
let VendorAccountPage

const localStore = new Map()
const sessionStore = new Map()

function installStorageMocks() {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => localStore.get(key) ?? null,
      setItem: (key, value) => localStore.set(key, String(value)),
      removeItem: (key) => localStore.delete(key),
    },
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => sessionStore.get(key) ?? null,
      setItem: (key, value) => sessionStore.set(key, String(value)),
      removeItem: (key) => sessionStore.delete(key),
    },
  })
}

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  process.env.VITE_PROFILE_API_MODE = 'remote'
  installStorageMocks()
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ vendorAuthApi } = await vite.ssrLoadModule('/src/features/auth/api/vendorAuthApi.ts'))
  ;({ verifyOtpService, logoutService } = await vite.ssrLoadModule('/src/services/authService.ts'))
  ;({ profileApi } = await vite.ssrLoadModule('/src/features/profile/api/profileApi.ts'))
  ;({ default: VendorLoginPage } = await vite.ssrLoadModule('/src/pages/vendor/LoginPage.tsx'))
  ;({ default: VendorAccountPage } = await vite.ssrLoadModule('/src/pages/vendor/AccountPage.tsx'))
})

beforeEach(() => {
  localStore.clear()
  sessionStore.clear()
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
  delete globalThis.sessionStorage
})

test('vendorAuthApi connects to OTP request, verify, /auth/me, /test/vendor, and stores shared session', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const req = new URL(url, 'http://test.invalid')
    const headers = new Headers(init.headers)
    calls.push({
      method: init.method ?? 'GET',
      path: req.pathname,
      auth: headers.get('Authorization'),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    })

    if (req.pathname === '/api/auth/otp/request') {
      return Response.json({
        message: 'verification code sent',
        expires_in_seconds: 300,
        debug_code: '123456',
      })
    }
    if (req.pathname === '/api/auth/otp/verify') {
      return Response.json({
        verified: true,
        phone: '+989121112233',
        access_token: 'vendor-jwt-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: { id: 'v-1', phone: '+989121112233', role: 'vendor' },
      })
    }
    if (req.pathname === '/api/auth/me') {
      return Response.json({ user_id: 'v-1', role: 'vendor' })
    }
    if (req.pathname === '/api/test/vendor') {
      return Response.json({ user_id: 'v-1', role: 'vendor' })
    }
    throw new Error(`unexpected ${req.pathname}`)
  })

  const otpRes = await vendorAuthApi.requestOtp('09121112233')
  assert.equal(otpRes.expiresIn, 300)
  assert.equal(otpRes.debugCode, '123456')

  const verifyRes = await vendorAuthApi.verifyOtp({ phone: '09121112233', code: '123456' })
  assert.equal(verifyRes.isVendor, true)
  assert.equal(verifyRes.accessToken, 'vendor-jwt-token')
  assert.equal(localStore.get('access_token'), 'vendor-jwt-token')
  assert.equal(JSON.parse(sessionStore.get('auth_session')).user.role, 'vendor')

  const me = await vendorAuthApi.getMe()
  assert.deepEqual(me, { userId: 'v-1', role: 'vendor' })

  const vendorAccess = await vendorAuthApi.verifyVendorAccess()
  assert.deepEqual(vendorAccess, { userId: 'v-1', role: 'vendor' })

  assert.equal(calls[2].auth, 'Bearer vendor-jwt-token')
  assert.equal(calls[3].auth, 'Bearer vendor-jwt-token')

  vendorAuthApi.logout()
  assert.equal(localStore.has('access_token'), false)
  assert.equal(sessionStore.has('auth_session'), false)
})

test('vendorAuthApi marks non-vendor accounts as isVendor: false', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return Response.json({
      verified: true,
      phone: '+989129998877',
      access_token: 'customer-jwt-token',
      token_type: 'Bearer',
      expires_in: 3600,
      user: { id: 'c-1', phone: '+989129998877', role: 'customer' },
    })
  })

  const res = await vendorAuthApi.verifyOtp({ phone: '09129998877', code: '654321' })
  assert.equal(res.isVendor, false)
  assert.equal(res.user.role, 'customer')
})

test('customer verifyOtpService and profileApi align with /auth/otp/verify and /customer/profile', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const req = new URL(url, 'http://test.invalid')
    calls.push({
      method: init.method ?? 'GET',
      path: req.pathname,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    })

    if (req.pathname === '/api/auth/otp/verify') {
      return Response.json({
        verified: true,
        phone: '+989123334455',
        access_token: 'cust-jwt',
        token_type: 'Bearer',
        expires_in: 3600,
        user: { id: 'c-2', phone: '+989123334455', role: 'customer' },
      })
    }
    if (req.pathname === '/api/customer/profile' && init.method === 'PATCH') {
      return Response.json({
        user_id: 'c-2',
        display_name: 'سارا محمدی',
        phone: '+989123334455',
      })
    }
    if (req.pathname === '/api/customer/profile') {
      return Response.json({
        user_id: 'c-2',
        display_name: 'سارا محمدی',
        phone: '+989123334455',
      })
    }
    throw new Error(`unexpected ${req.pathname}`)
  })

  await verifyOtpService({ phone: '09123334455', code: '111222' })
  assert.equal(localStore.get('access_token'), 'cust-jwt')
  assert.equal(JSON.parse(sessionStore.get('auth_session')).user.id, 'c-2')

  const updated = await profileApi.updateCurrent({ firstName: 'سارا', lastName: 'محمدی' })
  assert.equal(updated.id, 'c-2')
  assert.equal(updated.displayName, 'سارا محمدی')
  assert.deepEqual(calls[1], {
    method: 'PATCH',
    path: '/api/customer/profile',
    body: { display_name: 'سارا محمدی' },
  })
  assert.equal(calls[2].path, '/api/customer/profile')

  logoutService()
  assert.equal(localStore.has('access_token'), false)
  assert.equal(sessionStore.has('auth_session'), false)
})

test('VendorLoginPage and VendorAccountPage render cleanly', () => {
  const loginHtml = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(VendorLoginPage)),
  )
  assert.match(loginHtml, /ورود به پنل فروشنده/)
  assert.match(loginHtml, /شماره تلفن/)

  const accountHtml = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(VendorAccountPage)),
  )
  assert.match(accountHtml, /حساب فروشنده/)
})
