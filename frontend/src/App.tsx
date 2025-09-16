import React, { useState, useEffect } from 'react';
import './App.css';

interface ApiResponse {
  message: string;
  event: any;
}

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${apiUrl}/stats`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        setMessage(data.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Unitemate API v2</h1>

        {loading && <p>Loading...</p>}

        {error && (
          <div style={{ color: 'red', margin: '20px 0' }}>
            <p>Error: {error}</p>
            <p>API URL: {apiUrl}</p>
          </div>
        )}

        {!loading && !error && (
          <div style={{ margin: '20px 0' }}>
            <h2>API Response:</h2>
            <p style={{ fontSize: '18px', color: '#61dafb' }}>{message}</p>
          </div>
        )}

        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          Environment: {process.env.NODE_ENV}
        </p>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          API URL: {apiUrl}
        </p>
      </header>
    </div>
  );
}

export default App;
