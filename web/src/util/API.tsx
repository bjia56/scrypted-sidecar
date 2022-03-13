import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export async function callAPI(
  axiosMethod: (url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse>,
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse> {
  let loggedIn = await axios.get("/api/loggedIn").then((res) => {
    return res.data;
  });
  if (!loggedIn) {
    window.location = "/login" as string & Location;
  }
  return await axiosMethod(url, config);
};