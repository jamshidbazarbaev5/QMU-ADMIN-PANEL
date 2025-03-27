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

  const handleSubmit = async (data: any) => {
    if (!departmentId) {
      alert('Please select a department')
      return
    }

    try {
      setLoading(true)
      
      const filteredTranslations = Object.entries(data.translations).reduce((acc, [lang, trans]: [string, any]) => {
        if (trans.full_name || trans.position || trans.description) {
          acc[lang] = {
            full_name: trans.full_name || '',
            position: trans.position || '',
            description: trans.description || '',
            slug: trans.slug || ''
          }
        }
        return acc
      }, {} as Record<string, any>)

      const formData = new FormData()
      formData.append('email', email)
      formData.append('phone_number', phoneNumber)
      formData.append('faculty_department', departmentId)
      formData.append('translations', JSON.stringify(filteredTranslations))
      
      if (mainImage) {
        formData.append('main_image', mainImage)
      }

      const url = id 
        ? `/publications/teachers/${id}/` 
        : '/publications/teachers/'



      await api2({
        method: id ? 'put' : 'post',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      
      if (id) {
        navigate('/karsu-admin-panel/teachers')
      } else {
        setEmail('')
        setPhoneNumber('')
        setMainImage(null)
        setImagePreview(null)
        setTeacher(null)
        
        if (data.resetForm) {
          data.resetForm()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save teacher')
    } finally {
      setLoading(false)
    }
  }

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