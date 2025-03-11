
import React from 'react'

interface Column {
  header: string
  accessor?: string
  cell?: (item: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  currentLanguage?: string
  onRowClick?: (item: any) => void
  actions?: (item: any) => React.ReactNode
}

export function DataTable({ data, columns, onRowClick }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className="px-6 py-3 text-left text-xs font-medium text-[#6C5DD3] uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              className="hover:bg-gray-50 transition-colors"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.cell ? column.cell(item) : column.accessor ? item[column.accessor] : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}