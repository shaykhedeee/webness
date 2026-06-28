import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3001/api"
      : "/api"),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("webness_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshToken = localStorage.getItem("webness_refresh");
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post("/api/auth/refresh", {
            refreshToken,
          });
          localStorage.setItem("webness_token", data.data.token);
          localStorage.setItem("webness_refresh", data.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.data.token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem("webness_token");
          localStorage.removeItem("webness_refresh");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("webness_token");
        localStorage.removeItem("webness_refresh");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
