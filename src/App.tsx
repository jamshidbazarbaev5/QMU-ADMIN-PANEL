import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layout/layout';
import CreateAnnouncement from './pages/CreateAnnouncment';
import './App.css';
import AnnoucmentList from './pages/AnnoucmentList';
import EditAnnouncement from './pages/EditAnnoucment';
import CreateNewsCategory from './pages/CreateNewsCategory';
import NewsCategories from './pages/NewsCategories';
import CreateNews from './pages/CreateNews';

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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;