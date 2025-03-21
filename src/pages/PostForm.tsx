import { useState, useEffect } from 'react'
import { PageHeader } from '../helpers/PageHeader'
import { TranslatedForm } from '../helpers/TranslatedForm'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { fetchWithAuth, getAuthHeader } from '../api/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

interface PostFormProps {
  initialData?: any
  isEditing?: boolean
}

interface TranslatedField {
    name: string
    label: string
    type: 'text' | 'textarea' | 'richtext'
    required?: boolean
    editorConfig?: any
  }

interface MainMenuItem {
  id: number
  parent: number | null
  translations: {
    [key: string]: {
      name: string
      title: string
      slug: string
    }
  }
  menu_posts: number[]
}

interface FooterMenuItem {
  id: number
  parent: number | null
  translations: {
    [key: string]: {
      name: string
      slug: string
    }
  }
  footer_menu_posts: number[]
}

export function PostForm({ initialData, isEditing }: PostFormProps) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const currentLanguage = useLanguage()
  const token = localStorage.getItem('accessToken')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedMenu, setSelectedMenu] = useState(initialData?.menu || '')
  const [selectedFooterMenu, setSelectedFooterMenu] = useState(initialData?.footer_menu || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postData, setPostData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MainMenuItem[]>([])
  const [footerMenuItems, setFooterMenuItems] = useState<FooterMenuItem[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('')
  const [selectedParentFooterMenu, setSelectedParentFooterMenu] = useState<string>('')
  const [activeMenuType, setActiveMenuType] = useState<'header' | 'footer' | null>(null);
  const [hasImages, setHasImages] = useState<boolean | null>(initialData ? (!!initialData.main_image || !!initialData.images?.length) : null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!isEditing || !slug) return;
      if (!token) {
        console.error('No token found');
        navigate('/karsu-admin-panel/login');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetchWithAuth(
          `https://karsu.uz/api/publications/posts/${slug}/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized access');
            navigate('/karsu-admin-panel/login');
            return;
          }
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        
        // Set the menu data
        if (data.menu) {
          const menuItem = menuItems.find(m => m.id === data.menu);
          if (menuItem?.parent) {
            // If it's a child menu
            setSelectedParentMenu(menuItem.parent.toString());
            setSelectedMenu(menuItem.id.toString());
          } else {
            // If it's a parent menu
            setSelectedParentMenu(data.menu.toString());
          }
        }

        // Set the footer menu data
        if (data.footer_menu) {
          const footerMenuItem = footerMenuItems.find(m => m.id === data.footer_menu);
          if (footerMenuItem?.parent) {
            // If it's a child menu
            setSelectedParentFooterMenu(footerMenuItem.parent.toString());
            setSelectedFooterMenu(footerMenuItem.id.toString());
          } else {
            // If it's a parent menu
            setSelectedParentFooterMenu(data.footer_menu.toString());
          }
        }

        // Initialize empty translations for all languages if they don't exist
        const fullTranslations = {
          en: { title: '', description: '', slug: '' },
          ru: { title: '', description: '', slug: '' },
          uz: { title: '', description: '', slug: '' },
          kk: { title: '', description: '', slug: '' },
          ...data.translations
        };

        // Set the same slug for all languages
        const availableSlug = data.translations.en?.slug || 
                             data.translations.ru?.slug || 
                             data.translations.uz?.slug || 
                             data.translations.kk?.slug;

        if (availableSlug) {
          Object.keys(fullTranslations).forEach(lang => {
            if (fullTranslations[lang]) {
              fullTranslations[lang].slug = availableSlug;
            }
          });
        }

        setPostData({
          ...data,
          translations: fullTranslations
        });
        setExistingImages(data.images || []);
      } catch (error) {
        console.error('Error fetching post:', error);
        navigate('/karsu-admin-panel/posts');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch post data if menus are loaded
    if (menuItems.length > 0 && footerMenuItems.length > 0) {
      fetchPost();
    }
  }, [slug, isEditing, token, navigate, menuItems, footerMenuItems]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const [mainMenuResponse, footerMenuResponse] = await Promise.all([
          fetchWithAuth('https://karsu.uz/api/menus/main/', {
            headers: { ...getAuthHeader() }
          }),
          fetchWithAuth('https://karsu.uz/api/menus/footer/', {
            headers: { ...getAuthHeader() }
          })
        ]);

        if (!mainMenuResponse.ok || !footerMenuResponse.ok) {
          throw new Error('Failed to fetch menu items');
        }

        const mainMenuData = await mainMenuResponse.json();
        const footerMenuData = await footerMenuResponse.json();

        console.log('All menus:', mainMenuData);
        setMenuItems(mainMenuData);

        console.log('All footer menus:', footerMenuData);
        setFooterMenuItems(footerMenuData);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (initialData?.menu) {
      setActiveMenuType('header');
    } else if (initialData?.footer_menu) {
      setActiveMenuType('footer');
    }
  }, [initialData]);

  const handleAdditionalImages = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setUploadedImages(prev => [...prev, ...newFiles])
    }
  }

  if (!isEditing && hasImages === null) {
    return (
      <div className="container mx-auto p-6 mt-[50px]">
        <PageHeader
          title="Create Post"
          createButtonLabel="Back to Posts"
          onCreateClick={() => navigate('/karsu-admin-panel/posts')}
        />
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Would you like to include images in this post?</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setHasImages(true)}
              className="px-6 py-3 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors"
            >
              Yes, include images
            </button>
            <button
              onClick={() => setHasImages(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              No, text only
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto p-6 mt-[50px]">Loading...</div>
  }

  const fields: TranslatedField[] = [
    { name: 'title', label: 'Title', type: 'text', required: false },
    { name: 'description', label: 'Description', type: 'richtext', required: false },
  ]

  const handleSubmit = async (translations: any) => {
    setErrorMessage(null)
    
    // Validate translations
    if (!translations || Object.keys(translations).length === 0) {
      setErrorMessage('Please fill in at least one translation')
      return
    }

    // Check if at least one language has both title and description
    const hasValidTranslation = Object.values(translations.translations || {}).some((lang: any) => {
      return lang && typeof lang === 'object' && 
             typeof lang.title === 'string' && lang.title.trim() !== '' &&
             typeof lang.description === 'string' && lang.description.trim() !== ''
    })

    if (!hasValidTranslation) {
      setErrorMessage('Please fill in at least one complete translation (title and description)')
      return
    }

    if (!token) {
      console.error('No token found')
      navigate('/karsu-admin-panel/login')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      
      if (selectedImage) {
        formData.append('main_image', selectedImage)
      }

      uploadedImages.forEach((file) => {
        formData.append('uploaded_images', file)
      })

      // Only append menu IDs if they are actually selected
      if (selectedMenu && selectedMenu !== '_none') {
        formData.append('menu', selectedMenu)
      }
      
      if (selectedFooterMenu && selectedFooterMenu !== '_none') {
        formData.append('footer_menu', selectedFooterMenu)
      }

      // Format translations correctly
      formData.append('translations', JSON.stringify(translations.translations || {}))

      const url = isEditing 
        ? `https://karsu.uz/api/publications/posts/${slug}/`
        : `https://karsu.uz/api/publications/posts/`
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
        headers: {
          ...getAuthHeader(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }))
        if (response.status === 401) {
          console.error('Unauthorized access')
          navigate('/karsu-admin-panel/login')
          return
        }
        setErrorMessage(errorData.detail || 'Failed to save post')
        throw new Error(errorData.detail || 'Failed to save post')
      }

      navigate('/karsu-admin-panel/posts')
    } catch (error) {
      console.error('Error saving post:', error)
      if (!errorMessage) {
        setErrorMessage('An error occurred while saving the post')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getParentMenuItems = (items: MainMenuItem[]) => {
    return items.filter(item => item.parent === null)
  }

  const getSubMenuItems = (items: MainMenuItem[], parentId: number) => {
    return items.filter(item => item.parent === parentId)
  }

  const getParentFooterMenuItems = (items: FooterMenuItem[]) => {
    return items.filter(item => item.parent === null)
  }

  const getSubFooterMenuItems = (items: FooterMenuItem[], parentId: number) => {
    return items.filter(item => item.parent === parentId)
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title={isEditing ? 'Edit Post' : 'Create Post'}
        createButtonLabel="Back to Posts"
        onCreateClick={() => navigate('/karsu-admin-panel/posts')}
      />

      <div className="bg-white rounded-lg shadow p-6">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Menu
          </label>
          <div className="space-y-4">
            <Select
              disabled={activeMenuType === 'footer'}
              value={selectedParentMenu}
              onValueChange={(value) => {
                setSelectedParentMenu(value);
                setSelectedMenu('');
                if (value === '_none') {
                  setActiveMenuType(null);
                } else if (value) {
                  setActiveMenuType('header');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not in Header Menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not in Header Menu</SelectItem>
                {getParentMenuItems(menuItems).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.translations[currentLanguage]?.name || item.translations['en']?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParentMenu && (
              <Select
                value={selectedMenu}
                onValueChange={(value) => setSelectedMenu(value === '_none' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sub-menu (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select Sub-menu (Optional)</SelectItem>
                  {getSubMenuItems(menuItems, Number(selectedParentMenu)).map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.translations[currentLanguage]?.name || item.translations['en']?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Menu
          </label>
          <div className="space-y-4">
            <Select
              disabled={activeMenuType === 'header'}
              value={selectedParentFooterMenu}
              onValueChange={(value) => {
                setSelectedParentFooterMenu(value);
                setSelectedFooterMenu('');
                if (value === '_none') {
                  setActiveMenuType(null);
                } else if (value) {
                  setActiveMenuType('footer');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not in Footer Menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not in Footer Menu</SelectItem>
                {getParentFooterMenuItems(footerMenuItems).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.translations[currentLanguage]?.name || item.translations['en']?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParentFooterMenu && (
              <Select
                value={selectedFooterMenu}
                onValueChange={(value) => setSelectedFooterMenu(value === '_none' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sub-menu (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select Sub-menu (Optional)</SelectItem>
                  {getSubFooterMenuItems(footerMenuItems, Number(selectedParentFooterMenu)).map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.translations[currentLanguage]?.name || item.translations['en']?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {hasImages && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
              />
              {initialData?.main_image && (
                <img src={initialData.main_image} alt="Current" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleAdditionalImages(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#6C5DD3] file:text-white hover:file:bg-[#5b4eb8]"
              />
              
              <div className="grid grid-cols-4 gap-4 mt-4">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image.image} 
                      alt={`Existing ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => {
                        setExistingImages(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      onClick={() => {
                        setUploadedImages(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <TranslatedForm
          fields={fields}
          languages={['en', 'ru', 'uz', 'kk']}
          initialData={postData?.translations}
          onSubmit={handleSubmit}
          submitButton={
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors disabled:opacity-50"
            >
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Post' 
                  : 'Create Post'
              }
            </button>
          }
        />
      </div>
    </div>
  )
}