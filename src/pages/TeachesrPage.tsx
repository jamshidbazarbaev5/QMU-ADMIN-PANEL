import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '../helpers/PageHeader'
import { DataTable } from '../helpers/DataTable'
import { Button } from '../components/ui/button'
import { ErrorModal } from '../components/ui/errorModal'
import { fetchTeachers, deleteTeacher } from '../api/teachers'
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

export function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const data = await fetchTeachers(currentPage)
      setTeachers(data.results || [])
      // Calculate total pages based on count from API response
      const total = Math.ceil((data.count || 0) / 10) // Assuming 10 items per page
      setTotalPages(total > 0 ? total : 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api2.get('/menus/department/')
      setDepartments(response.data)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError('Failed to load departments')
    }
  }

  useEffect(() => {
    loadTeachers()
    fetchDepartments()
  }, [currentPage]) // Reload when page changes

  const handleCreateClick = () => {
    navigate('/karsu-admin-panel/teachers/create')
  }

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    navigate(`/karsu-admin-panel/teachers/${id}/edit`)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      await deleteTeacher(deleteId)
      await loadTeachers()
      setIsDeleteModalOpen(false)
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete teacher')
    }
  }

  const getDepartmentName = (departmentId: number) => {
    const department = departments.find(dept => dept.id === departmentId)
    if (!department) return '-'

    // Try English translation first
    if (department.translations?.kk?.name) {
      return department.translations.kk.name
    }
    // Fallback to Russian translation
    if (department.translations?.ru?.name) {
      return department.translations.ru.name
    }
    return '-'
  } 

  const columns = [
    {
      header: 'Full Name',
      accessor: 'translations.en.full_name',
      cell: (item: any) => item.translations?.en?.full_name || item.translations?.ru?.full_name || '-'
    },
    {
      header: 'Position',
      accessor: 'translations.en.position',
      cell: (item: any) => item.translations?.en?.position || item.translations?.ru?.position || '-'
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Phone',
      accessor: 'phone_number'
    },
    {
      header: 'Department',
      accessor: 'faculty_department',
      cell: (item: any) => getDepartmentName(item.faculty_department)
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
    navigate(`/karsu-admin-panel/teachers/${item.id}/edit`)
  }
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Teachers" 
        createButtonLabel="Add Teacher" 
        onCreateClick={handleCreateClick} 
      />
      
      <DataTable
        data={teachers}
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
              This action cannot be undone. This will permanently delete the teacher.
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