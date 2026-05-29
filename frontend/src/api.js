import axios from 'axios';

const client = axios.create({ baseURL: '/api/v1' });

export async function uploadTransactions(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await client.post('/upload', fd);
  return data;
}

export async function getFlaggedTransactions(userId, page = 1, limit = 100) {
  const { data } = await client.get('/fraud-check', { params: { userId, page, limit } });
  return data;
}

export async function getStats() {
  const { data } = await client.get('/stats');
  return data;
}

export async function getHealth() {
  const { data } = await client.get('/health');
  return data;
}
