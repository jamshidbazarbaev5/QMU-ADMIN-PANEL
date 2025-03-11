import { useState, useEffect } from 'react'

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('kk')

  useEffect(() => {
    const handleStorageChange = () => {
      const lang = localStorage.getItem('language') || 'kk'
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