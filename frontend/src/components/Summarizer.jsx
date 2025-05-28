import { useState } from 'react';

const Summarizer = ({ onSubmit }) => {
  const [inputType, setInputType] = useState('file');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputType === 'file' && file) {
      onSubmit({ file });
    } else if (inputType === 'url' && url.trim()) {
      onSubmit({ pdfUrl: url.trim() });
    } else if (inputType === 'text' && text.trim()) {
      onSubmit({ text: text.trim() });
    } else if (inputType === 'webpage' && url.trim()) {
      onSubmit({ webpageUrl: url.trim() });
    } else {
      alert('Please fill in the required input.');
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <label>
        <strong>Input Type:</strong>
        <select
          value={inputType}
          onChange={(e) => {
            setInputType(e.target.value);
            setFile(null);
            setUrl('');
            setText('');
          }}
        >
          <option value="file">Upload PDF File</option>
          <option value="url">PDF URL</option>
          <option value="webpage">Webpage URL</option>
          <option value="text">Plain Text</option>
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

      {(inputType === 'url' || inputType === 'webpage') && (
        <label>
          Enter URL:
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
            rows="6"
            placeholder="Paste or type your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
      )}

      <button className="summarize-btn" type="submit">
        Summarize
      </button>
    </form>
  );
};

export default Summarizer;
