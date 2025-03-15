import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Loader2 } from 'lucide-react'
import { fetchWithAuth, getAuthHeader } from '../api/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {  Plus } from 'lucide-react'


const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { 
    name: 'description', 
    label: 'Description', 
    type: 'richtext' as const, 
    required: true
  },
  { 
    name: 'history_of_faculty', 
    label: 'History of Faculty', 
    type: 'richtext' as const
  }
]

interface Department {
  id: number
  faculty: number
  translations: {
    [key: string]: {
      name: string
      description: string
    }
  }
}

export default function FacultyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [initialData, setInitialData] = useState(null)
  const [, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    if (id) {
      fetchFaculty()
      fetchDepartments()
    }
  }, [id, currentLanguage])

  const fetchFaculty = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://karsu.uz/api/menus/faculty/${id}/`)
      if (!response.ok) throw new Error('Failed to fetch faculty')
      const data = await response.json()
      console.log('Fetched data:', data)
      setEmail(data.email)
      setInitialData(data.translations)
      setCurrentLogo(data.logo)
    } catch (error) {
      console.error('Error fetching faculty:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    if (!id) return
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/menus/department/?faculty=${id}`, {
        headers: getAuthHeader(),
      })
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSubmit = async (translationData: any) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      
      if (selectedLogo) {
        formData.append('logo', selectedLogo)
      }
      
      formData.append('email', email)
      
     
      formData.append('translations', JSON.stringify(translationData.translations))

      const url = id 
        ? `https://karsu.uz/api/menus/faculty/${id}/`
        : `https://karsu.uz/api/menus/faculty/`

      const response = await fetchWithAuth(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to save faculty')
      
      navigate('/karsu-admin-panel/faculty')
    } catch (error) {
      console.error('Error saving faculty:', error)
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

  if (id && !initialData) {
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
          <CardTitle>{id ? 'Edit' : 'Create'} Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="departments" disabled={!id}>Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo</label>
                  {currentLogo && (
                    <div className="mb-4">
                      <img 
                        src={currentLogo} 
                        alt="Current logo" 
                        className="max-w-[200px] h-auto"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedLogo(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <TranslatedForm
                fields={translatedFields}
                languages={['en', 'ru', 'uz', 'kk']}
                onSubmit={handleSubmit}
                initialData={initialData}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="departments">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Departments</h3>
                  <Button
                    onClick={() => navigate(`/karsu-admin-panel/departments/create?faculty=${id}`)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Department
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/karsu-admin-panel/faculties')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}