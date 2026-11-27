import { env } from '@/config/env'
import { httpVendorApprovalApi } from './httpVendorApprovalApi'
import { mockVendorApprovalApi } from './mockVendorApprovalApi'

/** Switch with VITE_USE_MOCK_API; the UI only talks to this object. */
export const vendorApprovalApi = env.useMockApi ? mockVendorApprovalApi : httpVendorApprovalApi
