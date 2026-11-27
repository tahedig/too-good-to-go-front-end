/**
 * Lifecycle: pending → approved | rejected; approved → suspended; suspended → approved.
 * Rejected is final for the admin; the vendor must submit a new application.
 */
export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type VendorDecisionType = 'rejection' | 'suspension'

/** The latest rejection/suspension, shown to the admin and to the vendor. */
export type VendorDecision = {
  type: VendorDecisionType
  reasonCode: string
  message: string
  decidedAt: string
  decidedBy: string | null
}

export type Vendor = {
  id: string
  storeName: string
  ownerName: string
  category: string
  address: string
  phone: string
  email: string | null
  description: string | null
  imageUrl: string | null
  submittedAt: string
  status: VendorStatus
  statusUpdatedAt: string | null
  decision: VendorDecision | null
}

export type VendorListQuery = {
  statuses?: VendorStatus[]
  search?: string
  page?: number
  pageSize?: number
}

export type VendorListResponse = {
  items: Vendor[]
  total: number
  page: number
  pageSize: number
  /** Totals per status across all vendors, ignoring the current filters. */
  counts: Record<VendorStatus, number>
}

export type VendorDecisionPayload = {
  reasonCode: string
  message: string
}

export type VendorApprovalApi = {
  list(query: VendorListQuery): Promise<VendorListResponse>
  get(id: string): Promise<Vendor>
  approve(id: string): Promise<Vendor>
  reject(id: string, payload: VendorDecisionPayload): Promise<Vendor>
  suspend(id: string, payload: VendorDecisionPayload): Promise<Vendor>
  reactivate(id: string): Promise<Vendor>
}
