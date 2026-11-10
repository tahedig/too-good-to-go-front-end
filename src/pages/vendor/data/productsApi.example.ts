/**
 * Illustrative Axios adapter for the product repository; intentionally disabled.
 * Endpoint paths, authentication, response DTOs, pagination, draft semantics and image
 * upload protocol have NOT been provided by the backend. Verify all of them before use.
 * ProductInput's mock data URLs must be uploaded/mapped to backend image IDs or URLs.
 * A real adapter must handle rejected requests and map server validation errors to fields.
 *
 * import axios from 'axios'
 * import type { ProductInput, StoredProduct } from './products'
 *
 * const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 20000 })
 * // Add the application's actual authentication interceptor here.
 * export const productApi = {
 *   async list(): Promise<StoredProduct[]> {
 *     const { data } = await api.get<StoredProduct[]>('/vendor/products')
 *     return data // map the real response DTO here
 *   },
 *   async get(id: string): Promise<StoredProduct> {
 *     const { data } = await api.get<StoredProduct>(`/vendor/products/${encodeURIComponent(id)}`)
 *     return data
 *   },
 *   // Illustrative only: confirm delete/unpublish paths and reservation policies with backend.
 *   async remove(id: string): Promise<void> {
 *     await api.delete(`/vendor/products/${encodeURIComponent(id)}`)
 *   },
 *   async unpublish(id: string): Promise<void> {
 *     await api.post(`/vendor/products/${encodeURIComponent(id)}/unpublish`)
 *   },
 *   async save(input: ProductInput, id?: string): Promise<StoredProduct> {
 *     // First upload new image files and map their IDs/URLs according to the API contract.
 *     const { data } = id
 *       ? await api.put<StoredProduct>(`/vendor/products/${encodeURIComponent(id)}`, input)
 *       : await api.post<StoredProduct>('/vendor/products', input)
 *     return data
 *   },
 * }
 */
export {}
