// src/components/Summarizer.jsx
import { useState } from 'react';

const Summarizer = ({ onResult }) => {
  const [inputType, setInputType] = useState('file');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [webpage, setWebpage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputType === 'file' && file) {
      onResult({ file });
    } else if (inputType === 'url' && url.trim()) {
      onResult({ pdfUrl: url.trim() });
    } else if (inputType === 'text' && text.trim()) {
      onResult({ text: text.trim() });
    } else if (inputType === 'webpage' && webpage.trim()) {
      onResult({ webpageUrl: webpage.trim() });
    } else {
      alert('Please provide valid input.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="summarizer-form">
      <label className="input-label">
        Input Type:
        <select
          value={inputType}
          onChange={(e) => {
            setInputType(e.target.value);
            setFile(null);
            setUrl('');
            setText('');
            setWebpage('');
          }}
        >
          <option value="file">Upload PDF</option>
          <option value="url">PDF URL</option>
          <option value="text">Plain Text</option>
          <option value="webpage">Webpage URL</option>
        </select>
      </label>

      {inputType === 'file' && (
        <label className="input-label">
          Select PDF:
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </label>
      )}

      {inputType === 'url' && (
        <label className="input-label">
          Enter PDF URL:
          <input
            type="url"
            placeholder="https://example.com/file.pdf"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>
      )}

      {inputType === 'text' && (
        <label className="input-label">
          Enter Text:
          <textarea
            placeholder="Paste your content here..."
            rows="6"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
      )}

      {inputType === 'webpage' && (
        <label className="input-label">
          Enter Webpage URL:
          <input
            type="url"
            placeholder="https://example.com/article"
            value={webpage}
            onChange={(e) => setWebpage(e.target.value)}
            required
          />
        </label>
      )}

      <button type="submit" className="summarize-btn">Summarize</button>
    </form>
  );
};

export default Summarizer;
