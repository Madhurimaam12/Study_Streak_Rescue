const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('study_streak_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      // Clear token on 401
      localStorage.removeItem('study_streak_token');
      localStorage.removeItem('study_streak_user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Auth API
  async register(name, email, password, themePreference) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, themePreference }),
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Study Plans API
  async getPlans() {
    const res = await fetch(`${API_BASE}/plans`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getProgressAnalytics() {
    const res = await fetch(`${API_BASE}/plans/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getPlanById(id) {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createPlan(planData) {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    return handleResponse(res);
  },

  async toggleTask(planId, taskId, timeSpentMinutes = 0) {
    const res = await fetch(`${API_BASE}/plans/${planId}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ timeSpentMinutes }),
    });
    return handleResponse(res);
  },

  async rescuePlan(planId, options = {}) {
    const res = await fetch(`${API_BASE}/plans/${planId}/rescue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });
    return handleResponse(res);
  },

  async addTask(planId, taskData) {
    const res = await fetch(`${API_BASE}/plans/${planId}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async deleteTask(planId, taskId) {
    const res = await fetch(`${API_BASE}/plans/${planId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deletePlan(planId) {
    const res = await fetch(`${API_BASE}/plans/${planId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async suggestBreakdown(topic, totalHours = 2) {
    const res = await fetch(`${API_BASE}/plans/suggest-breakdown`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic, totalHours }),
    });
    return handleResponse(res);
  },
};
