import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

function createClient() {
  const auth = storePersist.get('auth');
  const headers = {};
  if (auth?.current?.token) {
    headers['Authorization'] = `Bearer ${auth.current.token}`;
  }
  const username = auth?.current?.username || auth?.current?.name;
  if (username) {
    headers['x-auth-user'] = username;
  }
  return axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers,
  });
}

export const leaveApprovalService = {
  // 1. Line Approvals (Hermes360 & Integrated Apps)
  getHermesUsers: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/hermes-users', { params });
    return response.data;
  },

  getApprovalLines: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/approval-lines', { params });
    return response.data;
  },

  getGlobalFallbackRule: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/approval-lines/fallback', { params });
    return response.data;
  },

  updateGlobalFallbackRule: async (payload) => {
    const client = createClient();
    const response = await client.put('leaveRequest/approval-lines/fallback', payload);
    return response.data;
  },

  getOrganizationStructure: async () => {
    const client = createClient();
    const response = await client.get('leaveRequest/organization-structure');
    return response.data;
  },

  previewScopeEmployees: async (payload = {}) => {
    const client = createClient();
    const response = await client.post('leaveRequest/approval-lines/preview-scope', payload);
    return response.data;
  },

  getApprovalLineEmployees: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/approval-lines/employees', { params });
    return response.data;
  },

  previewKeywordsEmployees: async (payload = {}) => {
    const client = createClient();
    const response = await client.post('leaveRequest/approval-lines/preview-keywords', payload);
    return response.data;
  },

  createApprovalLine: async (payload) => {
    const client = createClient();
    const response = await client.post('leaveRequest/approval-lines', payload);
    return response.data;
  },

  updateApprovalLine: async (id, payload) => {
    const client = createClient();
    const response = await client.put(`leaveRequest/approval-lines/${id}`, payload);
    return response.data;
  },

  deleteApprovalLine: async (id) => {
    const client = createClient();
    const response = await client.delete(`leaveRequest/approval-lines/${id}`);
    return response.data;
  },

  // 2. Email Server Config (with Custom Port)
  getEmailConfig: async () => {
    const client = createClient();
    const response = await client.get('leaveRequest/email-config');
    return response.data;
  },

  updateEmailConfig: async (payload) => {
    const client = createClient();
    const response = await client.put('leaveRequest/email-config', payload);
    return response.data;
  },

  testEmailConfig: async (payload) => {
    const client = createClient();
    const response = await client.post('leaveRequest/email-config/test', payload);
    return response.data;
  },

  // 3. Tarik Data Absensi & Data Karyawan
  exportAttendance: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/export/attendance', { params });
    return response.data;
  },

  exportEmployees: async (params = {}) => {
    const client = createClient();
    const response = await client.get('leaveRequest/export/employees', { params });
    return response.data;
  },
};

