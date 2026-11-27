import { env } from '@/config/env'
import { httpVendorApprovalApi } from './httpVendorApprovalApi'
import { mockVendorApprovalApi } from './mockVendorApprovalApi'

/** Switch with VITE_ADMIN_API_MODE=mock for offline mock testing; remote backend is default. */
export const vendorApprovalApi =
  env.adminApiMode === 'mock' ? mockVendorApprovalApi : httpVendorApprovalApi
