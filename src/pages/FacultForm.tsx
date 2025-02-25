import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Loader2 } from 'lucide-react'
import { getAuthHeader } from '../api/api'

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

export default function FacultyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [initialData, setInitialData] = useState(null)

  useEffect(() => {
    if (id) {
      fetchFaculty()
    }
  }, [id, currentLanguage])

  const fetchFaculty = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://debttracker.uz/${currentLanguage}/menus/faculty/${id}/`)
      if (!response.ok) throw new Error('Failed to fetch faculty')
      const data = await response.json()
      setEmail(data.email)
      setInitialData(data.translations)
      setCurrentLogo(data.logo)
    } catch (error) {
      console.error('Error fetching faculty:', error)
    } finally {
      setIsLoading(false)
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
      formData.append('translations', JSON.stringify(translationData))

      const url = id 
        ? `https://debttracker.uz/${currentLanguage}/menus/faculty/${id}/`
        : `https://debttracker.uz/${currentLanguage}/menus/faculty/`

      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to save faculty')
      
      navigate('/faculties')
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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Faculty</CardTitle>
        </CardHeader>
        <CardContent>
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

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/faculties')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}