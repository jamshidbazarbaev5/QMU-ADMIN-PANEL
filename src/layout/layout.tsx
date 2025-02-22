"use client"

import { useState } from "react"
import { useNavigate, Link, Outlet } from "react-router-dom"
import {
  FileText,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"


type Language = 'en' | 'ru' | 'uz' | 'kk'

export default function Layout() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en')
  const navigate = useNavigate()

  const handleLanguageChange = (value: Language) => {
    setCurrentLanguage(value)
    localStorage.setItem('language', value)
    window.dispatchEvent(new Event('storage'))
    }

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div className="flex h-screen">
      {/* Language Selector - Positioned at the very top */}
      <div className="fixed top-0 right-0 p-4 z-50">
        <Select
          value={currentLanguage}
          onValueChange={(value: Language) => handleLanguageChange(value)}
        >
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="O'zbekcha" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
            <SelectItem value="uz">O'zbekcha</SelectItem>
            <SelectItem value="kk">Qaraqalpaq</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Layout */}
      <div className="w-64 flex flex-col border-r bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 p-4">
          {/* Main Menu */}
          <div>
            <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">ASOSIY MENYU</h2>
            <Link to="/annoucment-list">
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-50 font-medium text-purple-600 hover:bg-purple-100 hover:text-purple-700">
                {/* <Plus className="h-5 w-5" /> */}
                Create Announcement
              </button>
            </Link>
          </div>

         

          {/* Others - Settings Section */}
          <div>
            <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">BOSHQALAR</h2>
            <div className="space-y-1">
              {[
                { icon: Settings, text: "Feedback", href: "/news-categories" },
                { icon: FileText, text: "News", href: "/create-news" },
                { icon: LayoutGrid, text: "Posts", href: "/create-news" },
                { icon: Users, text: "Useful Links", href: "/news-categories" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl font-medium hover:bg-gray-100"
                >
                  <item.icon className="h-5 w-5" />
                  {item.text}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Chiqish
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
       

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

