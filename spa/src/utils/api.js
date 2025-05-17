import axios from "axios";

const API_BASE = "https://task-dev-73yh.onrender.com"; // adjust if different

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
