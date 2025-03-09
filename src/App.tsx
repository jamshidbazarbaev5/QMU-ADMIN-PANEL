import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
// import { DepartmentPage } from './pages/DepartmentFormPage';
import { DocumentPage } from './pages/DocumentPage';
import { MenuAdminsPage } from './pages/MenuAdminsPage';
import { AgencyPage } from './pages/AgencyPage';
import { PositionPage } from './pages/PositionPage';
import { MenuAdminFormPage } from './pages/MenuAdminFormPage';
import './styles/ckeditor.css'
import FacultyForm from './pages/FacultForm';
import AgencyForm from './pages/AgencyForm';
import PositionForm from './pages/PositionForm';
import NewsList from './pages/NewsList';
import { PostForm } from './pages/PostForm';
import { Posts } from './pages/PostList';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { VideoForm } from './pages/VideoForm';
import { Videos } from './pages/Videos';
import { QuantityForm } from './pages/QuantityForm';
import { QuantityList } from './pages/QuantittyList';
import React, { useState, useEffect } from 'react';
import { ServicesPage } from './pages/ServicesPage';
import { GoalsPage } from './pages/GoalsPage';
import {DepartmentPage} from "./pages/DepartmentPage.tsx";
import { DepartmentFormPage } from './pages/DepartmentFormPage.tsx';
// import { DepartmentFormPage } from './pages/DeparmentPage';
import { DocumentForm } from './pages/DocumentForm'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('accessToken'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100">
        {isAuthenticated && <Layout />}
        <div className={`flex-1 overflow-auto ${isAuthenticated ? '' : 'w-full'}`}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />
            } />
            
            {/* All other routes wrapped in PrivateRoute */}
            <Route path="/" element={
              <PrivateRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-800">Welcome to Admin Panel</h1>
                </div>
              </PrivateRoute>
            } />
            <Route path="/create-announcement" element={<PrivateRoute><CreateAnnouncement /></PrivateRoute>} />
            <Route path="/annoucment-list" element={<PrivateRoute><AnnoucmentList /></PrivateRoute>} />
            <Route path="/edit-announcement/:slug" element={<PrivateRoute><EditAnnouncement /></PrivateRoute>} />
            <Route path="/create-news-category" element={<PrivateRoute><CreateNewsCategory /></PrivateRoute>} />
            <Route path="/news-categories" element={<PrivateRoute><NewsCategories /></PrivateRoute>} />
            <Route path="/create-news" element={<PrivateRoute><CreateNews /></PrivateRoute>} />
            <Route path="/edit-news-category/:id" element={<PrivateRoute><CreateNews /></PrivateRoute>} />
            <Route path="/feedback" element={<PrivateRoute><FeedbackList /></PrivateRoute>} />
            <Route path="/feedback/create" element={<PrivateRoute><FeedbackForm /></PrivateRoute>} />
            <Route path="/feedback/edit/:id" element={<PrivateRoute><FeedbackForm /></PrivateRoute>} />
            <Route path="/links" element={<PrivateRoute><LinksPage /></PrivateRoute>} />
            <Route path="/menus" element={<PrivateRoute><MenusPage /></PrivateRoute>} />
            <Route path="/faculty" element={<PrivateRoute><FacultyPage /></PrivateRoute>} />
             <Route path="/department" element={<PrivateRoute><DepartmentPage /></PrivateRoute>} />
            <Route path="/document" element={<PrivateRoute><DocumentPage /></PrivateRoute>} />
            <Route path="/menu-admins" element={<PrivateRoute><MenuAdminsPage /></PrivateRoute>} />
            <Route path="/agency" element={<PrivateRoute><AgencyPage /></PrivateRoute>} />
            <Route path="/position" element={<PrivateRoute><PositionPage /></PrivateRoute>} />
            <Route path="/menu-admins/create" element={<PrivateRoute><MenuAdminFormPage /></PrivateRoute>} />
            <Route path="/menu-admins/:id/edit" element={<PrivateRoute><MenuAdminFormPage /></PrivateRoute>} />
            <Route path="/faculties/new" element={<PrivateRoute><FacultyForm /></PrivateRoute>} />
            <Route path="/faculties/:id/edit" element={<PrivateRoute><FacultyForm /></PrivateRoute>} />
            <Route path="/agencies/new" element={<PrivateRoute><AgencyForm /></PrivateRoute>} />
            <Route path="/agencies/:slug/edit" element={<PrivateRoute><AgencyForm /></PrivateRoute>} />
            <Route path="/positions/new" element={<PrivateRoute><PositionForm /></PrivateRoute>} />
            <Route path="/positions/:id/edit" element={<PrivateRoute><PositionForm /></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><NewsList /></PrivateRoute>} />
            <Route path="/posts" element={<PrivateRoute><Posts /></PrivateRoute>} />
            <Route path="/posts/new" element={<PrivateRoute><PostForm /></PrivateRoute>} />
            <Route path="/posts/:slug/edit" element={<PrivateRoute><PostForm isEditing={true} /></PrivateRoute>} />
            <Route path="/videos" element={<PrivateRoute><Videos /></PrivateRoute>} />
            <Route path="/videos/new" element={<PrivateRoute><VideoForm /></PrivateRoute>} />
            <Route path="/videos/:id/edit" element={<PrivateRoute><VideoForm isEditing={true} /></PrivateRoute>} />
            <Route path="/quantities" element={<PrivateRoute><QuantityList /></PrivateRoute>} />
            <Route path="/quantities/new" element={<PrivateRoute><QuantityForm /></PrivateRoute>} />
            <Route path="/quantities/:id/edit" element={<PrivateRoute><QuantityForm isEditing={true} /></PrivateRoute>} />
            <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
            <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
            <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
            {/* <Route path="/departments/:id/edit" element={<PrivateRoute><DepartmentPage /></PrivateRoute>} /> */}
            {/* <Route path="/departments/create" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} /> */}
            <Route path="/departments/create" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} />
            <Route path="/departments/:id/edit" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} />
            <Route path="/documents/create" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
            <Route path="/documents/edit/:id" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;