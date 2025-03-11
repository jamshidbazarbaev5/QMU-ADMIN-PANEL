import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from '../helpers/PageHeader'
import { useLanguage } from '../hooks/useLanguage'

interface MenuTranslation {
  name: string;
}

interface Menu {
  id: number;
  translations: {
    [key: string]: MenuTranslation;
  };
}

export function Posts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const currentLanguage = useLanguage()
  const [menus, setMenus] = useState<Menu[]>([])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const url = searchQuery 
        ? `https://debttracker.uz/publications/posts/?title=${encodeURIComponent(searchQuery)}`
        : `https://debttracker.uz/publications/posts/`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      setPosts(data.results || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch('https://debttracker.uz/menus/main/')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMenus(data)
    } catch (error) {
      console.error('Error fetching menus:', error)
      setMenus([])
    }
  }

  useEffect(() => {
    console.log('Effect running, currentLanguage:', currentLanguage)
    fetchPosts()
    fetchMenus()
  }, [searchQuery, currentLanguage])

  // Helper function to get menu name
  const getMenuName = (menuId: number) => {
    const menu = menus.find(m => m.id === menuId)
    if (menu && menu.translations && menu.translations['kk']) {
      return menu.translations['kk'].name
    }
   
  }

  const columns = [
    {
      header: 'Image',
      accessor: 'main_image',
      cell: (item: any) => item.main_image ? (
        <img src={item.main_image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
      ) : '-'
    },
    {
      header: 'Title',
      accessor: `translations.${currentLanguage}.title`,
      cell: (item: any) => {
        const translation = item.translations['kk']
        return translation ? translation.title : '-'
      }
    },
    {
      header: 'Menu',
      accessor: 'menu',
      cell: (item: any) => getMenuName(item.menu)
    },
    {
      header: 'Date',
      accessor: 'date_posted',
      cell: (item: any) => new Date(item.date_posted).toLocaleDateString()
    }
  ]

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`https://debttracker.uz/publications/posts/${slug}/`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const getPostSlug = (item: any) => {
    // First try to get the slug for current language
    if (item.translations[currentLanguage]?.slug) {
      return item.translations[currentLanguage].slug;
    }
    
    // Fallback to English if current language is not available
    if (item.translations.en?.slug) {
      return item.translations.en.slug;
    }
    
    // If no English, take the first available translation
    const availableLanguages = Object.keys(item.translations);
    if (availableLanguages.length > 0) {
      return item.translations[availableLanguages[0]].slug;
    }
    
    console.error('No slug found for post:', item);
    return '';
  };

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Posts"
        createButtonLabel="Create Post"
        onCreateClick={() => navigate('/posts/new')}
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={posts}
          columns={columns}
          onRowClick={(item) => {
            const slug = getPostSlug(item);
            if (slug) {
              navigate(`/posts/${slug}/edit`);
            }
          }}
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const slug = getPostSlug(item);
                  if (slug) {
                    navigate(`/posts/${slug}/edit`);
                  }
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const slug = getPostSlug(item);
                  if (slug) {
                    handleDelete(slug);
                  }
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          )}
        />
      </div>
    </div>
  )
}