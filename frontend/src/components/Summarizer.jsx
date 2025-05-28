import { useState } from 'react';

const Summarizer = ({ onSubmit }) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (file) {
      onSubmit({ file });
    } else if (url.trim()) {
      onSubmit({ pdfUrl: url.trim() });
    } else if (text.trim()) {
      onSubmit({ text: text.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="summarizer-form">
      <h3>Summarize from:</h3>

      <label>
        PDF File:
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
      </label>

      <label>
        PDF URL:
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter PDF URL"
        />
      </label>

      <label>
        Raw Text:
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or paste raw text here"
          rows="6"
        />
      </label>

      <button type="submit">Summarize</button>
    </form>
  );
};

export default Summarizer;
