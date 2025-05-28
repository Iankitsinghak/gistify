// src/components/Summarizer.jsx
import { useState } from 'react';

const Summarizer = ({ onSubmit }) => {
  const [inputType, setInputType] = useState('file'); // default option
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [webpageUrl, setWebpageUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputType === 'file' && file) {
      onSubmit({ file });
    } else if (inputType === 'url' && url.trim()) {
      onSubmit({ pdfUrl: url.trim() });
    } else if (inputType === 'text' && text.trim()) {
      onSubmit({ text: text.trim() });
    } else if (inputType === 'webpage' && webpageUrl.trim()) {
      onSubmit({ webpageUrl: webpageUrl.trim() });
    } else {
      alert('Please fill in the required input.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="summarizer-form">
      <h2>PDF/Text/Webpage Summarizer</h2>

      <label>
        Select input type:
        <select
          value={inputType}
          onChange={(e) => {
            setInputType(e.target.value);
            setFile(null);
            setUrl('');
            setText('');
            setWebpageUrl('');
          }}
          className="input-select"
        >
          <option value="file">Upload PDF File</option>
          <option value="url">PDF URL</option>
          <option value="text">Plain Text</option>
          <option value="webpage">Webpage URL</option>
        </select>
      </label>

      {inputType === 'file' && (
        <label>
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
        <label>
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
        <label>
          Enter Text:
          <textarea
            placeholder="Paste your content here..."
            rows="8"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
      )}

      {inputType === 'webpage' && (
        <label>
          Enter Webpage URL:
          <input
            type="url"
            placeholder="https://example.com/article"
            value={webpageUrl}
            onChange={(e) => setWebpageUrl(e.target.value)}
            required
          />
        </label>
      )}

      <button type="submit" className="summarize-btn">
        Summarize
      </button>
    </form>
  );
};

export default Summarizer;
