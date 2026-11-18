import axios from 'axios'
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type {
  DeleteParams,
  GetParams,
  PatchParams,
  PostParams,
  PutParams,
} from '../types/apiTypes'
import { tokenStorage } from './tokenStorage'

// The Vite/Nginx development and container configs proxy /api to the Go service.
export const baseURL = '/api'

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error),
)

export async function getData<T = unknown>({
  endPoint,
  headers,
  params,
}: GetParams): Promise<T> {
  const response = await apiClient.get<T>(endPoint, { params, headers })
  return response.data
}

export async function postData<T = unknown>({
  endPoint,
  data,
  headers,
}: PostParams): Promise<T> {
  const response = await apiClient.post<T>(endPoint, data, { headers })
  return response.data
}

/** Leave Content-Type unset so Axios supplies the multipart boundary for FormData. */
export async function postImageData<T = unknown>({
  endPoint,
  data,
  headers,
}: PostParams<FormData>): Promise<T> {
  const response = await apiClient.post<T>(endPoint, data, { headers })
  return response.data
}

export async function patchData<T = unknown>({
  endPoint,
  data,
  headers,
}: PatchParams): Promise<T> {
  const response = await apiClient.patch<T>(endPoint, data, { headers })
  return response.data
}

export async function putData<T = unknown>({
  endPoint,
  data,
  headers,
}: PutParams): Promise<T> {
  const response = await apiClient.put<T>(endPoint, data, { headers })
  return response.data
}

export async function deleteData<T = unknown>({
  endPoint,
  data,
  headers,
}: DeleteParams): Promise<T> {
  const response = await apiClient.delete<T>(endPoint, { data, headers })
  return response.data
}
