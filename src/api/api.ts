export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const createAnnouncement = async (data: { translations: { en: { title: string; description: string }; ru: { title: string; description: string } } }) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetchWithAuth('https://debttracker.uz/ru/announcements/', {
        method: 'POST',
        headers: headerObj,
        body: JSON.stringify(data),
    });
    return response.json();
};

interface LoginCredentials {
    username: string;
    password: string;

  }
  
  
  
//   export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
//     const response = await fetch('https://debttracker.uz/token/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     });
    
//     const data = await response.json();
    
//     if (!response.ok) {
//       throw data;
//     }
    
//     // Store both access and refresh tokens
//     if (data.access && data.refresh) {
//       localStorage.setItem('accessToken', data.access);
//       localStorage.setItem('refreshToken', data.refresh);
//     }
    
//     return data;
//   };
  
  export const changePassword = async (newPassword: string): Promise<void> => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetchWithAuth('https://debttracker.uz/admin/change-credentials/', {
        method: 'POST',
        headers: headerObj,
        body: JSON.stringify({
            password: newPassword,
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw error;
    }
  };

interface TranslatedTitle {
  title: string;
}

interface QuantityData {
  translations: {
    en: TranslatedTitle;
    ru: TranslatedTitle;
    uz: TranslatedTitle;
    kk: TranslatedTitle;
  };
  quantity: number;
}

export const createQuantity = async (data: QuantityData) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetchWithAuth('https://debttracker.uz/en/publications/quantities/', {
        method: 'POST',
        headers: headerObj,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }

    return response.json();
};

export const updateQuantity = async (id: string, data: QuantityData) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetchWithAuth(`https://debttracker.uz/en/publications/quantities/${id}`, {
        method: 'PUT',
        headers: headerObj,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }

    return response.json();
};

// Add new interfaces
interface TokenResponse {
  access: string;
  refresh?: string;
}

interface RefreshResponse {
  access: string;
}

// Add token refresh function
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch('https://debttracker.uz/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }

    const data: RefreshResponse = await response.json();
    localStorage.setItem('accessToken', data.access);
    return data.access;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
};

// Update the fetch wrapper to handle token refresh
export const fetchWithAuth = async (url: string, options: RequestInit): Promise<Response> => {
  let response = await fetch(url, options);

  if (response.status === 401) {
    // Try to refresh the token
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Update the Authorization header with the new token
      const newHeaders = new Headers(options.headers);
      newHeaders.set('Authorization', `Bearer ${newToken}`);
      
      // Retry the original request with the new token
      response = await fetch(url, {
        ...options,
        headers: newHeaders,
      });
    }
  }

  return response;
};

interface LoginResponse extends TokenResponse {
  access: string;
  refresh?: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await fetch('https://debttracker.uz/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid credentials');
            } else if (response.status === 403) {
                throw new Error('Access forbidden');
            }
            throw new Error(data.detail || 'Login failed');
        }
        
        if (data.access) {
            localStorage.setItem('accessToken', data.access);
            if (data.refresh) {
                localStorage.setItem('refreshToken', data.refresh);
            }
        } else {
            throw new Error('No access token received');
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};