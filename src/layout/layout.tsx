"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link, Outlet } from "react-router-dom"
import {
  LogOut,
  Menu,
  Plus,
  MessageSquare,
  Newspaper,
  Grid,
  Link as LinkIcon,
  List,
  School,
  Building2,
  FileSpreadsheet,
  UserCog,
  Building as BuildingIcon,
  UserSquare2,
  Video,
  KeyRound,
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
  const [isMenuOpen, setIsMenuOpen] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      navigate("/login")
    }
  }, [navigate])

  const handleLanguageChange = (value: Language) => {
    setCurrentLanguage(value)
    localStorage.setItem('language', value)
    window.dispatchEvent(new Event('storage'))
    }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    navigate("/login")
  }

  return (
    <div className="flex h-screen">
      {/* Burger Menu Button */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>

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

      {/* Sidebar - Modified to show icons when collapsed */}
      <div className={`fixed left-0 top-0 h-full ${
        isMenuOpen ? 'w-64' : 'w-16'
      } transform transition-all duration-300 ease-in-out flex flex-col border-r bg-white z-40`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 mt-16">
          {isMenuOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
        </div>

        {/* Navigation - Added overflow-y-auto */}
        <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
          {/* Main Menu */}
          <div>
            {isMenuOpen && (
              <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">ASOSIY MENYU</h2>
            )}
            <Link to="/annoucment-list">
              <button className={`w-full flex items-center ${
                isMenuOpen ? 'gap-3 px-4' : 'justify-center'
              } py-2 rounded-xl  font-medium hover:bg-gray-100 `}>
                <Plus className="h-5 w-5" />
                {isMenuOpen && "Create Announcement"}
              </button>
            </Link>
          </div>

          {/* Others - Settings Section */}
          <div>
            {isMenuOpen && (
              <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">BOSHQALAR</h2>
            )}
            <div className="space-y-1">
              {[
                { icon: MessageSquare, text: "Feedback", href: "/feedback" },
                { icon: Newspaper, text: "News", href: "/news" },
                { icon: Grid, text: "CategoryNews", href: "/news-categories" },
                { icon: LinkIcon, text: "Useful Links", href: "/links" },
                { icon: List, text: "Menus", href: "/menus" },
                { icon: School, text: "Faculties", href: "/faculty" },
                { icon: Building2, text: "Department", href: "/department" },
                { icon: FileSpreadsheet, text: "Documents", href: "/document" },
                { icon: UserCog, text: "Menu Admins", href: "/menu-admins" },
                { icon: BuildingIcon, text: "Agency", href: "/agency" },
                { icon: UserSquare2, text: "Position", href: "/position" },
                { icon: Newspaper, text: "Posts", href: "/posts" },
                { icon: Video, text: "Videos", href: "/videos" },
                { icon: List, text: "Quantities", href: "/quantities" },
                { icon: KeyRound, text: "Change Password", href: "/change-password" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`w-full flex items-center ${
                    isMenuOpen ? 'gap-3 px-4' : 'justify-center'
                  } py-2 rounded-xl font-medium hover:bg-gray-100`}
                  title={!isMenuOpen ? item.text : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {isMenuOpen && item.text}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isMenuOpen ? 'gap-3 px-4' : 'justify-center'
            } py-2 rounded-xl font-medium text-red-600 hover:bg-red-50`}
            title={!isMenuOpen ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {isMenuOpen && "Chiqish"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isMenuOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Top Header */}
       

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

