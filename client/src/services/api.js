import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL + "/api", // Set this in .env
});

export default api;
