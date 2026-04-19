import { Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import GalleryPage from './pages/GalleryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  );
}
