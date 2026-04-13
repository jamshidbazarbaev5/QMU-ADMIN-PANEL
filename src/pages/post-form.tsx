import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TranslatedForm2 } from '../helpers/TranslatedForm2'
import { Button } from "../components/ui/button"
import { fetchWithAuth, getAuthHeader } from '../api/api'

interface MenuTranslation {
  name: string;
  title: string;
  slug: string;
}

interface Menu {
  id: number;
  parent: number | null;
  translations: {
    [key: string]: MenuTranslation;
  };
  children?: Menu[];
}

export function PostForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [includeImages, setIncludeImages] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [allMenus, setAllMenus] = useState<Menu[]>([])
  const [parentMenus, setParentMenus] = useState<Menu[]>([])
  const [childMenus, setChildMenus] = useState<Menu[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<number | null>(null)
  const [selectedChildMenu, setSelectedChildMenu] = useState<number | null>(null)
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    fetchMenus()
    if (slug) {
      fetchPostData()
    }
  }, [slug])

  const fetchPostData = async () => {
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/publications/posts/${slug}/`, {
        headers: getAuthHeader()
      })
      const data = await response.json()
      
      setInitialData(data.translations)
      
      setIncludeImages(!!data.main_image || (data.images && data.images.length > 0))
      
      if (data.menu) {
        const menuItem = allMenus.find(m => m.id === data.menu)
        if (menuItem?.parent) {
          setSelectedParentMenu(menuItem.parent)
          setSelectedChildMenu(data.menu)
          const children = allMenus.filter(m => m.parent === menuItem.parent)
          setChildMenus(children)
        } else {
          setSelectedParentMenu(data.menu)
          const children = allMenus.filter(m => m.parent === data.menu)
          setChildMenus(children)
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetchWithAuth('https://karsu.uz/api/menus/main/', {
        headers: getAuthHeader()
      })
      const data = await response.json()
      setAllMenus(data)

      const parents = data.filter((menu: Menu) => !menu.parent)
      setParentMenus(parents)
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const handleParentMenuChange = (menuId: number) => {
    setSelectedParentMenu(menuId)
    const children = allMenus.filter((menu: Menu) => menu.parent === menuId)
    setChildMenus(children)
    setSelectedChildMenu(null)
  }

  const handleSubmit = async (translationData: any) => {
    try {
      setIsLoading(true)

      const formData = new FormData()
      
      formData.append('menu', selectedChildMenu?.toString() || '')

      if (includeImages) {
        if (mainImage) {
          formData.append('main_image', mainImage)
        }
        additionalImages.forEach(image => {
          formData.append('uploaded_images', image)
        })
      }

      files.forEach(file => {
        formData.append('uploaded_files', file)
      })

      Object.entries(translationData).forEach(([lang, data]: [string, any]) => {
        if (data.title || data.description) {
          formData.append(`translations[${lang}]`, JSON.stringify({
            title: data.title,
            description: data.description
          }))
        }
      })

      const url = slug 
        ? `https://karsu.uz/api/publications/posts/${slug}/`
        : 'https://karsu.uz/api/publications/posts/'

      const method = slug ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          ...getAuthHeader()
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      navigate('/karsu-new-admin-panel/posts')
    } catch (error) {
      console.error('Error saving post:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  if (includeImages === null) {
    return (
      <div className="container mx-auto p-6 mt-[50px]">
        <h2 className="text-2xl font-bold mb-6">{slug ? 'Edit Post' : 'Create New Post'}</h2>
        <div className="space-y-4">
          <p className="text-lg">Would you like to include images in this post?</p>
          <div className="flex gap-4">
            <Button onClick={() => setIncludeImages(true)}>Yes, include images</Button>
            <Button onClick={() => setIncludeImages(false)}>No, skip images</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <h2 className="text-2xl font-bold mb-6">
        {slug ? 'Edit Post' : 'Create New Post'}
      </h2>

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Menu</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              onChange={(e) => handleParentMenuChange(Number(e.target.value))}
              value={selectedParentMenu || ''}
            >
              <option value="">Select Parent Menu</option>
              {parentMenus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.translations.en?.name || menu.translations.kk?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Child Menu</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              onChange={(e) => setSelectedChildMenu(Number(e.target.value))}
              value={selectedChildMenu || ''}
              disabled={!selectedParentMenu}
            >
              <option value="">Select Child Menu</option>
              {childMenus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.translations.en?.name || menu.translations.kk?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {includeImages && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Main Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMainImage(e.target.files?.[0] || null)}
                className="mt-1 block w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))}
                className="mt-1 block w-full"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Files</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-1 block w-full"
          />
        </div>
      </div>

      <TranslatedForm2
        fields={[
          {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true
          },
          {
            name: 'description',
            label: 'Description',
            type: 'richtext',
            required: true
          }
        ]}
        languages={['en', 'ru', 'uz', 'kk']}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={initialData}
      />
    </div>
  )
}