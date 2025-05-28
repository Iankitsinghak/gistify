import { useState } from 'react';

const Summarizer = ({ onSummarize }) => {
  const [text, setText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSummarize({ text, pdfUrl, file });
  };

  return (
    <form onSubmit={handleSubmit} className="summarizer-form">
      <label>Enter Text:</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text..." />

      <label>PDF URL:</label>
      <input type="text" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />

      <label>Upload PDF:</label>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />

      <button type="submit">Summarize</button>
    </form>
  );
};

export default Summarizer;
