import { useState, useEffect } from 'react'

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en')

  useEffect(() => {
    const handleStorageChange = () => {
      const lang = localStorage.getItem('language') || 'en'
      setCurrentLanguage(lang)
    }

    window.addEventListener('storage', handleStorageChange)
    handleStorageChange()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return currentLanguage
}