import * as React from "react"
import { cn } from '../../lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm",
          "placeholder-gray-400 shadow-sm",
          "transition-all duration-200",
          "focus:border-[#6C5DD3] focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]",
          "hover:border-gray-400",
          "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
          "dark:placeholder-gray-500 dark:hover:border-gray-500",
          "dark:focus:border-[#6C5DD3] dark:focus:ring-[#6C5DD3]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
