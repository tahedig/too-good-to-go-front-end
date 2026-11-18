export type VendorOrderStatus = 'active' | 'ready_for_pickup' | 'delivered' | 'cancelled';

export type OrderFilterStatus = 'all' | VendorOrderStatus;

export interface VendorCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface VendorPackage {
  id: string;
  title: string;
  image_url: string;
}

export interface VendorTimeSlot {
  start_time: string;
  end_time: string;
}

export interface VendorOrder {
  id: string;
  order_number: string;
  customer: VendorCustomer;
  package: VendorPackage;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: VendorOrderStatus;
  pickup_date: string; // YYYY-MM-DD or Jalali formatted string
  pickup_time_slot: VendorTimeSlot;
  created_at: string;
}

export interface VendorOrderPagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface VendorOrderListResponse {
  orders: VendorOrder[];
  pagination: VendorOrderPagination;
}

export interface VendorOrderSummary {
  date: string;
  total_reserved_packages: number;
  active_reservations_count: number;
  delivered_packages_count: number;
  total_revenue: number;
}

export interface VendorStoreActive {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface VerifyPickupPayload {
  pickup_code?: string;
}

export interface VerifyPickupResponse {
  success: boolean;
  order_id: string;
  status: string;
  delivered_at: string;
  message: string;
}

export interface ListVendorOrdersParams {
  date?: string;
  status?: OrderFilterStatus;
  page?: number;
  limit?: number;
}
