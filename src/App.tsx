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
// import { DocumentPage } from './pages/DocumentPage';
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
import { MainImageList } from './pages/MainImageList.tsx'
import { MainImageForm } from './pages/MainImageForm'
import { FacultyDeansPage } from './pages/FacultyDeans.tsx';
import { FacultyDeanFormPage } from './pages/FacultyDeanFormPage.tsx';
import { DepartmentDeanFormPage } from './pages/DepartmentDeansFormPage.tsx';
import { DepartmentDeansPage } from './pages/DeparmentDeansPage.tsx';
import { AgencyDeanFormPage } from './pages/AgencyDeansFormPage.tsx';
import { AgencyDeansPage } from './pages/AgencyDeansPage.tsx';
import { DocumentPage } from './pages/DocumentPage.tsx';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? children : <Navigate to="/karsu-admin-panel/login" />;
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
            <Route path="/karsu-admin-panel/login" element={
              isAuthenticated ? <Navigate to="/karsu-admin-panel" /> : <Login setIsAuthenticated={setIsAuthenticated} />
            } />
            
            {/* All other routes wrapped in PrivateRoute */}
            <Route path="/karsu-admin-panel" element={
              <PrivateRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-800">Welcome to Admin Panel</h1>
                </div>
              </PrivateRoute>
            } />
            <Route path="/karsu-admin-panel/create-announcement" element={<PrivateRoute><CreateAnnouncement /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/annoucment-list" element={<PrivateRoute><AnnoucmentList /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/edit-announcement/:slug" element={<PrivateRoute><EditAnnouncement /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/create-news-category" element={<PrivateRoute><CreateNewsCategory /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/news-categories" element={<PrivateRoute><NewsCategories /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/create-news" element={<PrivateRoute><CreateNews /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/edit-news-category/:id" element={<PrivateRoute><CreateNews /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/feedback" element={<PrivateRoute><FeedbackList /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/feedback/create" element={<PrivateRoute><FeedbackForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/feedback/edit/:id" element={<PrivateRoute><FeedbackForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/links" element={<PrivateRoute><LinksPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/menus" element={<PrivateRoute><MenusPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculty" element={<PrivateRoute><FacultyPage /></PrivateRoute>} />
             <Route path="/karsu-admin-panel/department" element={<PrivateRoute><DepartmentPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/menu-admins" element={<PrivateRoute><MenuAdminsPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agency" element={<PrivateRoute><AgencyPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/position" element={<PrivateRoute><PositionPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/menu-admins/create" element={<PrivateRoute><MenuAdminFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/menu-admins/:id/edit" element={<PrivateRoute><MenuAdminFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculties/new" element={<PrivateRoute><FacultyForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculties/:id/edit" element={<PrivateRoute><FacultyForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agencies/new" element={<PrivateRoute><AgencyForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agencies/:slug/edit" element={<PrivateRoute><AgencyForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/positions/new" element={<PrivateRoute><PositionForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/positions/:id/edit" element={<PrivateRoute><PositionForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/news" element={<PrivateRoute><NewsList /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/posts" element={<PrivateRoute><Posts /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/posts/new" element={<PrivateRoute><PostForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/posts/:slug/edit" element={<PrivateRoute><PostForm isEditing={true} /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/videos" element={<PrivateRoute><Videos /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/videos/new" element={<PrivateRoute><VideoForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/videos/:id/edit" element={<PrivateRoute><VideoForm isEditing={true} /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/quantities" element={<PrivateRoute><QuantityList /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/quantities/new" element={<PrivateRoute><QuantityForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/quantities/:id/edit" element={<PrivateRoute><QuantityForm isEditing={true} /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
            {/* <Route path="/departments/:id/edit" element={<PrivateRoute><DepartmentPage /></PrivateRoute>} /> */}
            {/* <Route path="/departments/create" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} /> */}
            <Route path="/karsu-admin-panel/departments/create" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/departments/:id/edit" element={<PrivateRoute><DepartmentFormPage /></PrivateRoute>} />

            <Route path="/karsu-admin-panel/documents/create" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/document" element={<PrivateRoute><DocumentPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/documents/edit/:id" element={<PrivateRoute><DocumentForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/main-image-list" element={<PrivateRoute><MainImageList /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/main-images/new" element={<PrivateRoute><MainImageForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/main-images/:id/edit" element={<PrivateRoute><MainImageForm /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculty-deans" element={<PrivateRoute><FacultyDeansPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculty-deans/new" element={<PrivateRoute><FacultyDeanFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/faculty-deans/:id/edit" element={<PrivateRoute><FacultyDeanFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/department-deans" element={<PrivateRoute><DepartmentDeansPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/department-deans/create" element={<PrivateRoute><DepartmentDeanFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/department-deans/:id/edit" element={<PrivateRoute><DepartmentDeanFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agency-deans" element={<PrivateRoute><AgencyDeansPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agency-deans/create" element={<PrivateRoute><AgencyDeanFormPage /></PrivateRoute>} />
            <Route path="/karsu-admin-panel/agency-deans/:id/edit" element={<PrivateRoute><AgencyDeanFormPage /></PrivateRoute>} />
          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;