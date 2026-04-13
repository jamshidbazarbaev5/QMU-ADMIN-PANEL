import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {  Loader2 } from 'lucide-react'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { ErrorModal } from '../components/ui/errorModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import api2 from '../api/api2'

export function TeacherForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState('kk')

  const fetchDepartments = async () => {
    try {
      const response = await api2.get('/menus/department/')
      setDepartments(response.data)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError('Failed to load departments')
    }
  }

  const fetchTeacherDetails = async () => {
    if (!id) return
    try {
      setInitialLoading(true)
      const response = await api2.get(`/publications/teachers/${id}/`)
      const teacherData = response.data  // Remove .results[0] as the data is directly in response.data
      
      setTeacher(teacherData)
      setEmail(teacherData.email || '')
      setPhoneNumber(teacherData.phone_number || '')
      setDepartmentId(teacherData.faculty_department?.toString() || '')
      
      if (teacherData.main_image) {
            setImagePreview(teacherData.main_image)
      }
    } catch (error) {
      console.error('Error fetching teacher:', error)
      setError('Failed to load teacher details')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
    if (id) {
      fetchTeacherDetails()
    }
  }, [id])

  const handleImageChange = (file: File | null) => {
    setMainImage(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(teacher?.main_image || null)
    }
  }

  const clearForm = (data: any) => {
    // Clear all fields except department
    setEmail('');
    setPhoneNumber('');
    setMainImage(null);
    setImagePreview(null);
    setTeacher(null);
  
    // Reset the form fields
    if (data.resetForm) {
      data.resetForm();
    }
  
    // Clear translations
    if (data.translations) {
      Object.keys(data.translations).forEach(lang => {
        if (data.translations[lang]) {
          data.translations[lang].full_name = '';
          data.translations[lang].position = '';
          data.translations[lang].description = '';
          data.translations[lang].slug = '';
        }
      });
    }
  };
  
  const handleSubmit = async (data: any) => {
    if (!departmentId) {
      alert('Please select a department');
      return;
    }
  
    try {
      setLoading(true);

      console.log('Incoming translations:', data);

      // Create a translations object from the flat data
      const translations: { [key: string]: any } = {};
      Object.keys(data).forEach(key => {
        const match = key.match(/^(full_name|position|description)_(\w+)$/);
        if (match) {
          const [_, field, lang] = match;
          if (!translations[lang]) {
            translations[lang] = {
              full_name: '',
              position: '',
              description: '',
              slug: ''
            };
          }
          translations[lang][field] = data[key] || '';
        }
      });

      console.log('Restructured translations:', translations);

      // Check if any language has valid full_name
      const hasValidTranslation = Object.values(translations).some(
        (translation) => translation.full_name && translation.full_name.trim() !== ''
      );

      console.log('Has valid translation:', hasValidTranslation);

      if (!hasValidTranslation) {
        throw new Error("At least one translation with full name must be provided");
      }

      const formData = new FormData();
      formData.append('email', email);
      formData.append('phone_number', phoneNumber);
      formData.append('faculty_department', departmentId);
      formData.append('translations', JSON.stringify(translations));

      if (mainImage) {
        formData.append('main_image', mainImage);
      }

      const url = id ? `/publications/teachers/${id}/` : '/publications/teachers/';

      await api2({
        method: id ? 'put' : 'post',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (id) {
        navigate('/karsu-new-admin-panel/teachers');
      } else {
        // Clear form but keep department
        clearForm(data);
        // Show success message
        alert('Teacher created successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };
  
  const translatedFields = [
    {
      name: 'full_name',
      label: 'Full Name',
      type: 'text' as const,
      required: true
    },
    {
      name: 'position',
      label: 'Position',
      type: 'text' as const,
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richtext' as const,
      required: true,
    }
  ]

  // Function to get department name in the current language
  const getDepartmentName = (dept: any) => {
    if (dept.translations?.[currentLanguage]?.name) {
      return dept.translations[currentLanguage].name
    }
    
    // Try English if current language translation is not available
    if (dept.translations?.en?.name) {
      return dept.translations.en.name
    }
    
    // Fallback to department ID if no translations available
    return `Department ${dept.id}`
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit' : 'Create'} Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Faculty/Department</label>
                <Select
                  value={departmentId}
                  onValueChange={setDepartmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem 
                        key={dept.id} 
                        value={dept.id.toString()}
                        className="whitespace-normal py-2 break-words"
                      >
                        {getDepartmentName(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-md"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>



              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Teacher Photo</label>
                {imagePreview && (
                  <img 
                    src={imagePreview}
                    alt="Current"
                    className="w-20 h-20 object-cover rounded mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            </div>

            <TranslatedForm
              fields={translatedFields}
              languages={['en', 'ru', 'uz', 'kk']}
              onSubmit={handleSubmit}
              initialData={teacher?.translations}
              isLoading={loading}
              onLanguageChange={setCurrentLanguage}
            />
          </div>
        </CardContent>
      </Card>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
}