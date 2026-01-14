export interface MessageResponse {
  message: string;
}

export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}
