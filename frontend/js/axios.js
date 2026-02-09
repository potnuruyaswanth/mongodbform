const api = window.axios.create({
  baseURL: "http://127.0.0.1:3000", // backend URL - use 127.0.0.1 to match Live Server origin
  withCredentials: true //  allows cookies
});

// --- interceptor ---
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
        window.location.href = "/login.html";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);


export default api;
