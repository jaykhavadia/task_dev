import axios from "axios";

const API_BASE = "http://localhost:8080/api"; // adjust if different

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
