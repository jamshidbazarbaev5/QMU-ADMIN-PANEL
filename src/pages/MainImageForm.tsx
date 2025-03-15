import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { fetchWithAuth, getAuthHeader } from '../api/api'

export function MainImageForm() {
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      fetchImage()
    }
  }, [id])

  const fetchImage = async () => {
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/publications/images/${id}/`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setPreviewUrl(data.main_img)
        setIsActive(data.is_active)
      }
    } catch (error) {
      console.error('Error fetching image:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      if (image) {
        formData.append('main_img', image)
      }
      formData.append('is_active', isActive.toString())

      const url = id 
        ? `https://karsu.uz/api/publications/images/${id}/`
        : 'https://karsu.uz/api/publications/images/'
      
      const method = id ? 'PATCH' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          ...getAuthHeader(),
          // Don't set Content-Type here, let the browser set it for FormData
        },
        body: formData
      })

      if (response.ok) {
        navigate('/karsu-admin-panel/main-image-list')
      }
    } catch (error) {
      console.error('Error saving image:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Main Image' : 'Add New Main Image'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="image">Image</Label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full"
              />
              {previewUrl && (
                <div className="mt-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                id="is-active"
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/karsu-admin-panel/main-images')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#6C5DD3] text-white hover:bg-[#5b4eb8]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {id ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}