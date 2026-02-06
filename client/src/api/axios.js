import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true
});

let isRefreshing = false;
let queue = [];

const processQueue = (error) => {
  queue.forEach(p => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/refresh")
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original));
      }

      isRefreshing = true;

      try {
        await api.post("/refresh");
        processQueue(null);
        return api(original);
      } catch (e) {
        processQueue(e);
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
