// User Endpoints

export interface UserEndpoints {
  GET_ALL: string;
  GET_DETAIL: (id: string) => string;
}

export const USER: UserEndpoints = {
  GET_ALL: "/api/user",
  GET_DETAIL: (id: string): string => `/api/user/${id}`,
};
