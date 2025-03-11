"use client"

import { useState } from "react"
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
  ChevronDown,
  ChevronRight,
} from "lucide-react"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select"



export default function Layout() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [openSections, setOpenSections] = useState<string[]>(['main'])



  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    window.dispatchEvent(new Event('auth-change'))
    navigate("/login")
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  // Organize menu items into sections
  const menuSections = {
    главная: [
      {icon: Plus, text: "Объявления", href: "/annoucment-list"},
      {icon: MessageSquare, text: "Обратная связь", href: "/feedback"},
      {icon: Newspaper, text: "Новости", href: "/news"},
      {icon: Grid, text: "Категории новостей", href: "/news-categories"},
    ],
    структура: [
      {icon: School, text: "Факультеты", href: "/faculty"},
      {icon: Building2, text: "Кафедры", href: "/department"},
    ],
    контент: [
      {icon: LinkIcon, text: "Полезные ссылки", href: "/links"},
      {icon: List, text: "Меню", href: "/menus"},
      {icon: FileSpreadsheet, text: "Документы", href: "/document"},
      {icon: Newspaper, text: "Публикации", href: "/posts"},
      {icon: Video, text: "Видео", href: "/videos"},
      {icon: FileSpreadsheet, text: "Количества", href: "/quantities"},
    ],
    управление: [
      {icon: UserCog, text: "Администрация", href: "/menu-admins"},
      {icon: UserSquare2, text: "Должности", href: "/position"},
      {icon: BuildingIcon, text: "Отделы", href: "/agency"},
    ],
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

      {/* Top Right Controls - Language, Password, Logout */}
      <div className="fixed top-0 right-0 p-4 z-50 flex items-center gap-2">
        {/* <Select
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
        </Select> */}

        <Link
          to="/change-password"
          className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
          title="Изменить пароль"
        >
          <KeyRound className="h-5 w-5" />
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-red-600"
          title="Выход"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full ${
        isMenuOpen ? 'w-64' : 'w-16'
      } transform transition-all duration-300 ease-in-out flex flex-col border-r bg-white z-40`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 mt-16">
          {isMenuOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {Object.entries(menuSections).map(([section, items]) => (
            <div key={section} className="space-y-1">
              <button
                onClick={() => toggleSection(section)}
                className={`w-full flex items-center ${
                  isMenuOpen ? 'gap-3 px-4' : 'justify-center'
                } py-2 rounded-xl font-medium hover:bg-gray-100`}
              >
                {isMenuOpen ? (
                  <>
                    {openSections.includes(section) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="capitalize">{section}</span>
                  </>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {openSections.includes(section) && (
                <div className="space-y-1 ml-4">
                  {items.map((item, index) => (
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
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${
        isMenuOpen ? 'ml-64' : 'ml-16 w-[calc(100%-4rem)]'
      } transition-all duration-300`}>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

