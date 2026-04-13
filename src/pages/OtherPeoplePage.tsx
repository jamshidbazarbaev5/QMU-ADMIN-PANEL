import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Button } from '../components/ui/button'
import { ErrorModal } from '../components/ui/errorModal'
import { Pagination } from '../components/ui/Pagination'
import api2 from '../api/api2'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"

export function OtherPeoplePage() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  const loadPeople = async () => {
    try {
      setLoading(true)
      const filters = {
        page: currentPage,
      }
      const response = await api2.get('/publications/persons/', { params: filters })
      setPeople(response.data.results || [])
      const total = Math.ceil((response.data.count || 0) / 10)
      setTotalPages(total > 0 ? total : 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load people')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPeople()
  }, [currentPage])

  const handleCreateClick = () => {
    navigate('/karsu-new-admin-panel/other-people/create')
  }

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigate(`/karsu-new-admin-panel/other-people/${id}/edit`)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      await api2.delete(`/publications/persons/${deleteId}/`)
      await loadPeople()
      setIsDeleteModalOpen(false)
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person')
    }
  }

  const columns = [
    {
      header: 'Full Name',
      accessor: 'translations.en.full_name',
      cell: (item: any) => item.translations?.kk?.full_name || item.translations?.uz?.full_name || '-'
    },
    {
      header: 'Description',
      accessor: 'translations.en.description',
      cell: (item: any) => {
        const description = item.translations?.kk?.description || item.translations?.uz?.description || '-'
        const truncatedDescription = description.length > 100 ? description.substring(0, 100) + '...' : description
        return <div dangerouslySetInnerHTML={{ __html: truncatedDescription }}  />
      }
    }
  ]

  const renderActions = (item: any) => (
    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => handleEditClick(e, item.id)}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => handleDeleteClick(e, item.id)}
        className="text-red-600 border-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  const handleRowClick = (item: any) => {
    navigate(`/karsu-new-admin-panel/other-people/${item.id}/edit`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading && !people.length) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Other People" 
        createButtonLabel="Add Person" 
        onCreateClick={handleCreateClick} 
      />
      
     
      
      <DataTable
        data={people}
        columns={columns}
        onRowClick={handleRowClick}
        actions={renderActions}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this person.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
}