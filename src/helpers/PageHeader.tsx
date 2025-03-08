import { Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  createButtonLabel: string
  onCreateClick?: () => void,
 
 
}

export function PageHeader({ title, createButtonLabel, onCreateClick, }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 mt-[50px] ml-[40px]">
      <h1 className="text-2xl font-bold text-[#6C5DD3]">{title}</h1>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5b4eb8] transition-colors"
      >
        <Plus className="h-5 w-5" />
        {createButtonLabel}
      </button>
    </div>
  )
}