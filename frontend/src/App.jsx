import { useState } from 'react';
import Summarizer from './components/Summarizer';
import Result from './components/Result';
import { summarize } from './utils/api';
import './styles.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async ({ text, pdfUrl, file }) => {
    setLoading(true);
    setError(null);
    setSummary(null); // clear previous summary on new request

    try {
      const data = await summarize({ text, pdfUrl, file });

      if (data.error) {
        throw new Error(data.error);
      }

      setSummary(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>PDF/Text Summarizer</h1>
      <Summarizer onSubmit={handleSummarize} />

      {loading && <p>⏳ Summarizing...</p>}

      {error && <p className="error">⚠️ {error}</p>}

      {summary && <Result data={summary} />}
    </div>
  );
}

export default App;
