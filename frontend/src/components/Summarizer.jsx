import { useState } from 'react';

const Summarizer = ({ onResult }) => {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async (e) => {
    e.preventDefault();
    setLoading(true);

    let response;
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('http://localhost:5000/summarize', {
          method: 'POST',
          body: formData,
        });
      } else if (inputText.startsWith('http')) {
        response = await fetch('http://localhost:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: inputText }),
        });
      } else {
        response = await fetch('http://localhost:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
      }

      const result = await response.json();
      onResult(result);
    } catch (err) {
      console.error('Summarize error:', err);
      onResult({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSummarize} className="summarizer-form">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste text or PDF link here"
        rows={5}
        required={!file}
      />
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>
    </form>
  );
};

export default Summarizer;
