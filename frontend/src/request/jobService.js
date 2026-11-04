import axios from 'axios';
import { API_BASE_URL, BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import { triggerAutoLogout } from '@/utils/authSession';

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

export const getAssetUrl = (relativePath) => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const base = (BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${cleanPath}`;
};

export const jobService = {
  getJobs: async (params = {}) => {
    const client = createClient();
    const response = await client.get('v1/jobs', { params });
    return response.data;
  },

  getJobById: async (id) => {
    const client = createClient();
    const response = await client.get(`v1/jobs/${id}`);
    return response.data;
  },

  createJob: async (payload) => {
    const client = createClient();
    const response = await client.post('v1/jobs', payload);
    return response.data;
  },

  updateJob: async (id, payload) => {
    const client = createClient();
    const response = await client.put(`v1/jobs/${id}`, payload);
    return response.data;
  },

  deleteJob: async (id) => {
    const client = createClient();
    const response = await client.delete(`v1/jobs/${id}`);
    return response.data;
  },

  submitForApproval: async (id) => {
    const client = createClient();
    const response = await client.put(`v1/jobs/${id}`, { status: 'pending_approval' });
    return response.data;
  },

  getJobApplicants: async (jobId) => {
    const client = createClient();
    const response = await client.get(`v1/jobs/${jobId}/applicants`);
    return response.data;
  },

  updateApplicantStatus: async (applicantId, payload) => {
    const client = createClient();
    const response = await client.patch(`v1/applicants/${applicantId}/status`, payload);
    return response.data;
  },

  convertToEmployee: async (applicantId) => {
    const client = createClient();
    const response = await client.post(`v1/applicants/${applicantId}/convert-to-employee`);
    return response.data;
  },

  getPendingApprovals: async () => {
    const client = createClient();
    const response = await client.get('v1/jobs/pending-approvals');
    return response.data;
  },

  approveJob: async (id, payload = {}) => {
    const client = createClient();
    const response = await client.post(`v1/jobs/${id}/approve`, payload);
    return response.data;
  },

  rejectJob: async (id, payload = {}) => {
    const client = createClient();
    const response = await client.post(`v1/jobs/${id}/reject`, payload);
    return response.data;
  },

  getJobApprovals: async (id) => {
    const client = createClient();
    const response = await client.get(`v1/jobs/${id}/approvals`);
    return response.data;
  },

  getAllApplicants: async (params = {}) => {
    const client = createClient();
    const response = await client.get('v1/applicants', { params });
    return response.data;
  },

  // Phase 3 & 4: Full 18-Section Application Form Preview / Print
  getApplicantFullForm: async (applicantId) => {
    const client = createClient();
    const response = await client.get(`v1/applicants/${applicantId}/full-form`);
    return response.data;
  },

  // Applicant Hiring Multi-Step Approvals
  requestHireApproval: async (applicantId, payload = {}) => {
    const client = createClient();
    const response = await client.post(`v1/applicants/${applicantId}/request-hire-approval`, payload);
    return response.data;
  },

  getPendingHireApprovals: async () => {
    const client = createClient();
    const response = await client.get('v1/applicants/pending-hire-approvals');
    return response.data;
  },

  approveHireStep: async (applicantId, payload = {}) => {
    const client = createClient();
    const response = await client.post(`v1/applicants/${applicantId}/approve-hire`, payload);
    return response.data;
  },

  rejectHireStep: async (applicantId, payload = {}) => {
    const client = createClient();
    const response = await client.post(`v1/applicants/${applicantId}/reject-hire`, payload);
    return response.data;
  },

  getApplicantApprovals: async (applicantId) => {
    const client = createClient();
    const response = await client.get(`v1/applicants/${applicantId}/approvals`);
    return response.data;
  },

  getApplicantStageHistory: async (applicantId) => {
    const client = createClient();
    const response = await client.get(`v1/applicants/${applicantId}/stage-history`);
    return response.data;
  },

  resendPortalEmail: async (applicantId) => {
    const client = createClient();
    const response = await client.post(`v1/applicants/${applicantId}/resend-portal-email`);
    return response.data;
  },

  // Notification Settings & Logs (Phase 2 & 4)
  getNotificationSettings: async () => {
    const client = createClient();
    const response = await client.get('v1/recruitment/notification-settings');
    return response.data;
  },

  updateNotificationSettings: async (payload) => {
    const client = createClient();
    const response = await client.put('v1/recruitment/notification-settings', payload);
    return response.data;
  },

  getNotificationLogs: async (params = {}) => {
    const client = createClient();
    const response = await client.get('v1/recruitment/notification-logs', { params });
    return response.data;
  },

  testEmail: async (payload) => {
    const client = createClient();
    const response = await client.post('v1/recruitment/test-email', payload);
    return response.data;
  },

  sendBroadcast: async (payload) => {
    const client = createClient();
    const response = await client.post('v1/recruitment/send-broadcast', payload);
    return response.data;
  },

  // SMTP Handshake Socket Test (Real TCP Socket Verification)
  testSmtpHandshake: async (payload = {}) => {
    const client = createClient();
    const response = await client.post('v1/recruitment/test-smtp-handshake', payload);
    return response.data;
  },

  // Multi-Level Approver Configuration (Job Posting & Hiring)
  getApprovalWorkflowSteps: async () => {
    const client = createClient();
    const response = await client.get('v1/recruitment/approval-workflow-steps');
    return response.data;
  },

  updateApprovalWorkflowSteps: async (payload) => {
    const client = createClient();
    const response = await client.put('v1/recruitment/approval-workflow-steps', payload);
    return response.data;
  },
};

export default jobService;
