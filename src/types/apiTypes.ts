export interface BaseParams {
  endPoint: string
  headers?: Record<string, string>
}

export interface GetParams extends BaseParams {
  params?: Record<string, unknown>
}

export interface PostParams<Data = unknown> extends BaseParams {
  data: Data
}

export type PatchParams<Data = unknown> = PostParams<Data>
export type PutParams<Data = unknown> = PostParams<Data>

export interface DeleteParams<Data = unknown> extends BaseParams {
  data?: Data
}
