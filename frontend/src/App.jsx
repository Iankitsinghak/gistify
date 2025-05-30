import { useState } from 'react';
import Summarizer from './components/Summarizer';
import Result from './components/Result';
import { summarize } from './utils/api';
import './App.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async ({ text, pdfUrl, file }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await summarize({ text, pdfUrl, file });

      if (data.error) throw new Error(data.error);
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Gistify - Summarizer</h1>
      <Summarizer onSummarize={handleSummarize} />
      {loading && <p>Summarizing...</p>}
      {error && <p className="error">⚠ {error}</p>}
      {summary && <Result data={summary} />}
    </div>
  );
}

export default App;
