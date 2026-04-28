let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token?: string | null) => {
  accessToken = token ?? null;
};

export const clearAccessToken = () => {
  accessToken = null;
};
