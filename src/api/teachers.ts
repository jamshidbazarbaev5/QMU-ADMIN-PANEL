import api2 from './api2'

interface TeachersFilters {
  page?: number;
  full_name?: string;
  faculty_department?: string;
}

export const fetchTeachers = async (filters: TeachersFilters) => {
  const response = await api2.get('/publications/teachers/', {
    params: filters
  })
  // Return the full response data including count, next, previous, and results
  return response.data
}

export const fetchTeacher = async (id: string) => {
  const response = await api2.get(`/publications/teachers/${id}`)
  return response.data
}

export const createTeacher = async (data: any) => {
  const formData = new FormData()
  
  // Add main image if provided
  if (data.main_image && data.main_image instanceof File) {
    formData.append('main_image', data.main_image)
  }
  
  // Add basic fields
  if (data.email) formData.append('email', data.email)
  if (data.phone_number) formData.append('phone_number', data.phone_number)
  if (data.faculty_department_id) formData.append('faculty_department_id', data.faculty_department_id)
  
  // Add translations
  if (data.translations) {
    Object.keys(data.translations).forEach(lang => {
      const translation = data.translations[lang]
      Object.keys(translation).forEach(field => {
        formData.append(`translations[${lang}][${field}]`, translation[field])
      })
    })
  }
  
  const response = await api2.post('/publications/teachers', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response.data
}

export const updateTeacher = async (id: string, data: any) => {
  const formData = new FormData()
  
  // Add main image if provided
  if (data.main_image && data.main_image instanceof File) {
    formData.append('main_image', data.main_image)
  }
  
  // Add basic fields
  if (data.email) formData.append('email', data.email)
  if (data.phone_number) formData.append('phone_number', data.phone_number)
  if (data.faculty_department_id) formData.append('faculty_department_id', data.faculty_department_id)
  
  // Add translations
  if (data.translations) {
    Object.keys(data.translations).forEach(lang => {
      const translation = data.translations[lang]
      Object.keys(translation).forEach(field => {
        formData.append(`translations[${lang}][${field}]`, translation[field])
      })
    })
  }
  
  const response = await api2.post(`/publications/teachers/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response.data
}

export const deleteTeacher = async (id: string) => {
  const response = await api2.delete(`/publications/teachers/${id}`)
  return response.data
}

export const fetchDepartments = async () => {
  const response = await api2.get('/menus/department')
  return response.data
}