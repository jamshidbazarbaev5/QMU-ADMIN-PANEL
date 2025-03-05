import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { useLanguage } from '../hooks/useLanguage'
import { Input } from '../components/ui/input'
import debounce from 'lodash/debounce'
import {fetchWithAuth, getAuthHeader} from '../api/api'

interface NewsPost {
  id: number
  category: number
  goals: number[]
  main_image: string
  views_count: number
  date_posted: string
  translations: {
    [key: string]: {
      title: string
      description: string
      slug: string
    }
  }
}

export default function NewsList() {
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [news, setNews] = useState<NewsPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setSearchTitle] = useState('')

  const fetchNews = async (title?: string) => {
    try {
      const queryParams = new URLSearchParams()
      if (title) queryParams.append('title', title)
      
      const response = await fetchWithAuth(
        `https://debttracker.uz/news/posts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        {
          headers: {
            ...getAuthHeader()
          }
        }
      )
      if (!response.ok) throw new Error('Failed to fetch news')
      const data = await response.json()
      setNews(data.results)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = debounce((searchValue: string) => {
    fetchNews(searchValue)
  }, 300)

  useEffect(() => {
    fetchNews()
  }, [currentLanguage])

  const columns = [
    {
      header: 'Image',
      accessor: 'main_image',
      cell: (item: NewsPost) => (
        <img 
          src={item.main_image} 
          alt={item.translations[currentLanguage]?.title || ''} 
          className="w-12 h-12 object-cover rounded"
        />
      )
    },
    {
      header: 'Title',
      accessor: 'title',
      cell: (item: NewsPost) => (
        <span>{item.translations[currentLanguage]?.title || item.translations.en?.title || 'Untitled'}</span>
      )
    },
    {
      header: 'Views',
      accessor: 'views_count',
      cell: (item: NewsPost) => (
        <span>{item.views_count}</span>
      )
    },
    {
      header: 'Date Posted',
      accessor: 'date_posted',
      cell: (item: NewsPost) => (
        <span>{format(new Date(item.date_posted), 'dd MMM yyyy')}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (item: NewsPost) => {
        // Get the slug from the current language or fall back to other available languages
        const slug = item.translations[currentLanguage]?.slug || 
                    item.translations.ru?.slug ||
                    item.translations.en?.slug ||
                    item.translations.uz?.slug ||
                    item.translations.kk?.slug

        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (slug) {
                  navigate(`/create-news?id=${slug}`)
                } else {
                  console.error('No slug found for news item:', item)
                  alert('Error: Could not edit this news item')
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
          </div>
        )
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C5DD3]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="News"
        createButtonLabel="Create News"
        onCreateClick={() => navigate('/create-news')}
      />
      
      <div className="mb-4">
        <Input
          placeholder="Search by title..."
          onChange={(e) => {
            setSearchTitle(e.target.value)
            debouncedSearch(e.target.value)
          }}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={news}
          columns={columns}
          onRowClick={(item) => navigate(`/news/${item.id}`)}
        />
      </div>
    </div>
  )
}