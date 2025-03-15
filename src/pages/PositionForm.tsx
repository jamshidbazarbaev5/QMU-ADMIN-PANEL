import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Loader2 } from 'lucide-react'
import {fetchWithAuth, getAuthHeader} from '../api/api'

interface PositionTranslation {
  name: string;
  description?: string;  // Make description optional since it's not always present
}

interface Position {
  id?: number;
  email: string;
  position: number;
  translations: {
    [key: string]: PositionTranslation;
  };
}

const translatedFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
]


export default function PositionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('0')  // Default to '0' instead of empty string
  const [initialData, setInitialData] = useState<Position['translations'] | null>(null)

  useEffect(() => {
    if (id) {
      fetchPosition()
    }
  }, [id, currentLanguage])

  const fetchPosition = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://karsu.uz/api/menus/position/${id}/`)
      
      if (!response.ok) throw new Error('Failed to fetch position')
      const data: Position = await response.json()
      setEmail(data.email || '')
      setPosition(data.position?.toString() || '0')

      // Ensure all languages have both name and description fields
      const translations: Record<string, PositionTranslation> = {}
      const languages = ['en', 'ru', 'uz', 'kk']
      
      languages.forEach(lang => {
        translations[lang] = {
          name: data.translations[lang]?.name || '',
          description: data.translations[lang]?.description || ''
        }
      })

      console.log('Setting initial data:', translations) // Debug log
      setInitialData(translations)
    } catch (error) {
      console.error('Error fetching position:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('Initial data updated:', initialData)
  }, [initialData])

  const handleSubmit = async (translationData:any) => {
    if (!position) {
      alert('Please enter a position number')
      return
    }

    setIsLoading(true)
    try {
      // Filter out empty translations
     
      const payload: Position = {
        email,
        position: parseInt(position),
        translations: translationData.translations
      }

      console.log('Sending payload:', payload) // Debug log

      const url = id 
        ? `https://karsu.uz/api/menus/position/${id}/`
        : `https://karsu.uz/api/menus/position/`

      const response = await fetchWithAuth(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()  
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save position')
      }
      
      navigate('/karsu-admin-panel/position')
    } catch (error) {
      console.error('Error saving position:', error)
      alert('Failed to save position. Please try again.')
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
          <CardTitle>{id ? 'Edit' : 'Create'} Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Position Number</label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
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
            submitButton={
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/karsu-admin-panel/positions')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}