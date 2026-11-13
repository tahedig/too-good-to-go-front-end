export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'crumb',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@example.com',
  /** When true, features with a mock adapter use in-browser data instead of the backend. */
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
}
