import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import Report from './pages/Report';
import NotFound from './pages/not-found';
import { Button } from './components/ui/button';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div dir="rtl" className="min-h-screen bg-gray-50">
          <nav className="bg-primary text-primary-foreground p-4">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
              <div className="text-2xl font-bold mb-4 sm:mb-0">דוח רפואנים חודשי</div>
              <div className="flex gap-4">
                <Link to="/report">
                  <Button variant="secondary">דוח חודשי</Button>
                </Link>
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto py-6 px-4">
            <Routes>
              <Route path="/" element={<Navigate to="/report" replace />} />
              <Route path="/report" element={<Report />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          <footer className="bg-gray-100 p-4 text-center text-gray-600 mt-8">
            <div className="container mx-auto">
              דוח רפואנים © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
