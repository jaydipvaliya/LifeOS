import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
