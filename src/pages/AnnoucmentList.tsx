import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { DataTable } from '../helpers/DataTable'
import { PageHeader } from'../helpers/PageHeader'
import { Input } from "../components/ui/input"
import { useLanguage } from '../hooks/useLanguage'

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

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const currentLanguage = useLanguage()
  const navigate = useNavigate()

  const fetchAnnouncements = async (lang: string, query?: string) => {
    try {
      const searchParams = new URLSearchParams()
      if (query) {
        searchParams.append('title', query)
      }
      
      const url = `https://debttracker.uz/${lang}/announcements/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const filteredAnnouncements = data.results.filter((announcement: Announcement) => {
          const translation = announcement.translations[lang];
          return translation && translation.title && translation.description && translation.slug;
        });
        setAnnouncements(filteredAnnouncements);
      } else {
        console.error('Failed to fetch announcements:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  useEffect(() => {
    fetchAnnouncements(currentLanguage, searchQuery)
  }, [currentLanguage, searchQuery])

  const handleEdit = (announcement: Announcement) => {
    const slug = announcement.translations[currentLanguage]?.slug || ''
    navigate(`/edit-announcement/${slug}?id=${announcement.id}`)
  }

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
      cell: (item: Announcement) => item.translations[currentLanguage]?.title || '-'
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (item: Announcement) => (
        <div 
          dangerouslySetInnerHTML={{ 
            __html: item.translations[currentLanguage]?.description || '-'
          }}
          className="max-w-md truncate"
        />
      )
    },
    {
      header: 'Slug',
      accessor: 'slug',
      cell: (item: Announcement) => item.translations[currentLanguage]?.slug || '-'
    }
  ]

  const renderActions = (item: Announcement) => (
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
  )

  return (
    <div className="container mx-auto p-6 mt-[50px]">
      <PageHeader
        title="Announcements"
        createButtonLabel="Create Announcement"
        onCreateClick={() => navigate('/create-announcement')}
      />

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
    </div>
  )
}