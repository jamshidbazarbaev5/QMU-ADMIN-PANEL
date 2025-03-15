import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from'../helpers/PageHeader'
import { Input } from "../components/ui/input"
import { useLanguage } from '../hooks/useLanguage'
import { fetchWithAuth, getAuthHeader } from '../api/api'
import { Button } from "../components/ui/button"

interface Announcement {
  id: number
  date_post: string
  translations: {
    [key: string]: {
      title: string
      description: string
      slug: string
      content?: string
    }
  }
}

interface Column {
  header: string
  accessor: string
  cell?: (item: any, index?: number) => React.ReactNode
}

interface PaginationResponse {
  count: number
  next: string | null
  previous: string | null
  results: Announcement[]
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const currentLanguage = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchAnnouncements = async (_lang: string, query?: string, page: number = 1) => {
    try {
      const searchParams = new URLSearchParams()
      if (query) {
        searchParams.append('title', query)
      }
      searchParams.append('page', page.toString())
      searchParams.append('page_size', '10')
      
      const url = `https://karsu.uz/api/announcements/?${searchParams.toString()}`
      const response = await fetch(url)
      if (response.ok) {
        const data: PaginationResponse = await response.json()
        setAnnouncements(data.results)
        setTotalItems(data.count)
        setTotalPages(Math.ceil(data.count / 10))
      } else {
        console.error('Failed to fetch announcements:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  useEffect(() => {
    fetchAnnouncements(currentLanguage, searchQuery, currentPage)
  }, [currentLanguage, searchQuery, currentPage])

  // Add this helper function to get the first available translation
  const getFirstAvailableTranslation = (translations: Announcement['translations']) => {
    // Priority order for languages
    const languageOrder = ['ru', 'en', 'uz', 'kk'];
    
    // First try the current language
    if (translations[currentLanguage]) {
      return {
        translation: translations[currentLanguage],
        language: currentLanguage
      };
    } 

    // Then try each language in order until we find one
    for (const lang of languageOrder) {
      if (translations[lang]) {
        return {
          translation: translations[lang],
          language: lang
        };
      }
    }

    // If no translation is found, return null
    return null;
  };

  const handleEdit = (announcement: Announcement) => {
    const availableTranslation = getFirstAvailableTranslation(announcement.translations);
    if (!availableTranslation) return;

    const slug = availableTranslation.translation.slug;
    navigate(`/karsu-admin-panel/edit-announcement/${slug}?id=${announcement.id}`);
  };

  const handleDelete = async (announcement: Announcement) => {
    const availableTranslation = getFirstAvailableTranslation(announcement.translations);
    if (!availableTranslation) return;

    const slug = availableTranslation.translation.slug;
    
    try {
      const response = await fetchWithAuth(`https://karsu.uz/api/announcements/${slug}/`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });
      
      if (response.ok) {
        fetchAnnouncements(currentLanguage, searchQuery, currentPage);
      } else {
        console.error('Failed to delete announcement:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const columns: Column[] = [
    {
      header: 'ID',
      accessor: 'id',
      cell: (_: any, index: number | undefined) => index ? index + 1 : '-'
    },
    {
      header: 'Date',
      accessor: 'date_post',
      cell: (item: Announcement) => format(new Date(item.date_post), 'dd MMM yyyy')
    },
    {
      header: 'Title',
      accessor: 'title',
      cell: (item: Announcement) => {
        const availableTranslation = getFirstAvailableTranslation(item.translations);
        if (!availableTranslation) return '-';
        
        return (
          <div className="flex items-center gap-2">
            <span>{availableTranslation.translation.title}</span>
            {availableTranslation.language !== currentLanguage && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                {availableTranslation.language.toUpperCase()}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (item: Announcement) => {
        const availableTranslation = getFirstAvailableTranslation(item.translations);
        if (!availableTranslation) return '-';
        
        return (
          <div className="flex items-center gap-2">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: availableTranslation.translation.description 
              }}
              className="max-w-md truncate"
            />
            {availableTranslation.language !== currentLanguage && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                {availableTranslation.language.toUpperCase()}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Slug',
      accessor: 'slug',
      cell: (item: Announcement) => {
        const availableTranslation = getFirstAvailableTranslation(item.translations);
        if (!availableTranslation) return '-';
        
        return (
          <div className="flex items-center gap-2">
            <span>{availableTranslation.translation.slug}</span>
            {availableTranslation.language !== currentLanguage && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                {availableTranslation.language.toUpperCase()}
              </span>
            )}
          </div>
        );
      }
    }
  ]

  const renderActions = (item: Announcement) => (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(item)
        }}
        className="flex items-center gap-2 px-3 py-1 text-[#6C5DD3] hover:bg-[#6C5DD3]/10 rounded-md transition-colors"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(item)
        }}
        className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )

  // Add pagination controls component
  const Pagination = () => {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {totalItems} items total
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Announcements"
        createButtonLabel="Create Announcement"
        onCreateClick={() => navigate('/karsu-admin-panel/create-announcement')}
      />

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1) // Reset to first page when searching
          }}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={announcements}
        columns={columns}
        onRowClick={handleEdit}
        actions={renderActions}
        currentLanguage={currentLanguage}
      />

      <Pagination />
    </div>
  )
}