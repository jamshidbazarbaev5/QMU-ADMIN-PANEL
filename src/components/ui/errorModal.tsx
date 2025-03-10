import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog"
import { Button } from "./button"
import { XCircle } from "lucide-react"

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  errors: Record<string, string[]> | string
}

export function ErrorModal({ isOpen, onClose, errors }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-6 w-6" />
            Ошибка
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {typeof errors === 'string' ? (
            <p className="text-red-600">{errors}</p>
          ) : (
            <ul className="list-disc pl-4 space-y-2">
              {Object.entries(errors).map(([key, messages]) => (
                <li key={key}>
                  <span className="font-semibold">{key}:</span>
                  <ul className="pl-4 text-red-600">
                    {messages.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}