import React from 'react';
import DownloadForm from './components/DownloadForm';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">YouTube Downloader</h1>
      <DownloadForm />
    </div>
  );
}

export default App;