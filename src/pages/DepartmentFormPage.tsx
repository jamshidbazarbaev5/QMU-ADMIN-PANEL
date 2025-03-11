import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { fetchWithAuth, getAuthHeader } from '../api/api'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Loader2 } from 'lucide-react'

interface Faculty {
  id: number
  translations: {
    [key: string]: {
      name: string
    }
  }
}

interface Department {
  translations: {
    [key: string]: {
      name: string;
      description: string;
    }
  }
}

export function DepartmentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [searchParams] = useSearchParams()
  const facultyId = searchParams.get('faculty')

  const translatedFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'richtext' as const, required: true },
  ]

  useEffect(() => {
    fetchFaculties()
    if (id) {
      fetchDepartment(id)
    } else if (facultyId) {
      setSelectedFaculty(facultyId)
    }
  }, [id, facultyId])

  const fetchFaculties = async () => {
    try {
      const response = await fetchWithAuth('https://debttracker.uz/menus/faculty/', {
        headers: getAuthHeader(),
      })
      const data = await response.json()
      setFaculties(data)
    } catch (error) {
      console.error('Error fetching faculties:', error)
    }
  }

  const fetchDepartment = async (departmentId: string) => {
    try {
      const response = await fetchWithAuth(`https://debttracker.uz/menus/department/${departmentId}/`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setEditingDepartment(data);
      setSelectedFaculty(String(data.faculty));
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  }

  const handleSubmit = async (translatedData: any) => {
    if (!selectedFaculty) {
      alert('Please select a faculty')
      return
    }

    setIsLoading(true)
    try {
      const endpoint = id
        ? `https://debttracker.uz/menus/department/${id}/`
        : 'https://debttracker.uz/menus/department/'

      const method = id ? 'PUT' : 'POST'

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faculty: parseInt(selectedFaculty),
          translations: translatedData,
        }),
      })

      if (response.ok) {
        navigate('/department')
      }
    } catch (error) {
      console.error('Error saving department:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && id) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  if (id && !editingDepartment) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Faculty</label>
              <Select
                value={selectedFaculty}
                onValueChange={setSelectedFaculty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((faculty) => (
                    <SelectItem key={faculty.id} value={String(faculty.id)}>
                      {faculty.translations[currentLanguage]?.name ||
                       faculty.translations.en?.name ||
                       faculty.translations.ru?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TranslatedForm
            fields={translatedFields}
            languages={['en', 'ru', 'uz', 'kk']}
            onSubmit={handleSubmit}
            initialData={editingDepartment?.translations}
            isLoading={isLoading}
          />

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/departments')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
