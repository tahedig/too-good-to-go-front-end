export interface CustomerProfile {
  id: string
  firstName: string
  lastName: string
  displayName: string
  phoneNumber: string
  phoneVerified: boolean
}

export interface UpdateCustomerProfilePayload {
  firstName: string
  lastName: string
}
