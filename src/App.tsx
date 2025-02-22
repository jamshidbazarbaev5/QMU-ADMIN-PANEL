import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layout/layout';
import CreateAnnouncement from './pages/CreateAnnouncment';
import './App.css';
import AnnoucmentList from './pages/AnnoucmentList';
import EditAnnouncement from './pages/EditAnnoucment';
import CreateNewsCategory from './pages/CreateNewsCategory';
import NewsCategories from './pages/NewsCategories';
import CreateNews from './pages/CreateNews';
import FeedbackList from './pages/FeedbackList';
import FeedbackForm from './pages/FeedbackForm';
import { LinksPage } from './pages/Links';
import { MenusPage } from './pages/MenusPage';
import { FacultyPage } from './pages/FacultyPage';
import { DepartmentPage } from './pages/DepartmentPage';
import { DocumentPage } from './pages/DocumentPage';
import { MenuAdminsPage } from './pages/MenuAdminsPage';
import { AgencyPage } from './pages/AgencyPage';
import { PositionPage } from './pages/PositionPage';
import { MenuAdminFormPage } from './pages/MenuAdminFormPage';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Layout />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800">Welcome to Admin Panel</h1>
              </div>
            } />
            <Route path="/create-announcement" element={<CreateAnnouncement />} />
            <Route path="/annoucment-list" element={<AnnoucmentList />} />
            <Route path="/edit-announcement/:slug" element={<EditAnnouncement />} />
            <Route path="/create-news-category" element={<CreateNewsCategory />} />
            <Route path="/news-categories" element={<NewsCategories />} />
            <Route path="/create-news" element={<CreateNews />} />
            <Route path="/feedback" element={<FeedbackList />} />
            <Route path="/feedback/create" element={<FeedbackForm />} />
            <Route path="/feedback/edit/:id" element={<FeedbackForm />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/menus" element={<MenusPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/department" element={<DepartmentPage />} />
            <Route path="/document" element={<DocumentPage />} /> 
            <Route path="/menu-admins" element={<MenuAdminsPage />} />
            <Route path="/agency" element={<AgencyPage />} />
            <Route path="/position" element={<PositionPage />} />
            <Route path="/menu-admins" element={<MenuAdminsPage />} />
            <Route path="/menu-admins/create" element={<MenuAdminFormPage />} />
            <Route path="/menu-admins/:id/edit" element={<MenuAdminFormPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;