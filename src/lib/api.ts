// API configuration for Beyond Speech
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  // Contact form submission
  submitContact: async (data: {
    role: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact form');
    }

    return response.json();
  },

  // Health check
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

export default api;