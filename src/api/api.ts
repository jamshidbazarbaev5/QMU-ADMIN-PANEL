export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const createAnnouncement = async (data: { translations: { en: { title: string; description: string }; ru: { title: string; description: string } } }) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetch('https://debttracker.uz/ru/announcements/', {
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
  
  interface AuthResponse {
    access: string;
    refresh: string;
  }
  
  export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('https://debttracker.uz/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw data;
    }
    
    // Store both access and refresh tokens
    if (data.access && data.refresh) {
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    }
    
    return data;
  };
  
  export const changePassword = async (newPassword: string): Promise<void> => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetch('https://debttracker.uz/admin/change-credentials/', {
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

export const createQuantity = async (data: { title: string; quantity: number }) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetch('https://debttracker.uz/publications/quantities/', {
        method: 'POST',
        headers: headerObj,
        body: JSON.stringify(data),
    });

    if (response.status === 401) {
        throw { response };
    }

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }

    const responseData = await response.json();
    if (Array.isArray(responseData)) {
        throw new Error('Received list instead of created object');
    }

    return responseData;
};

export const updateQuantity = async (id: string, data: { title: string; quantity: number }) => {
    const headerObj = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
    };

    const response = await fetch(`https://debttracker.uz/publications/quantities/${id}`, {
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