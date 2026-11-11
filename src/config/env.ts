export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'crumb',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@example.com',
  profileApiMode: import.meta.env.VITE_PROFILE_API_MODE === 'remote' ? 'remote' : 'mock',
}
