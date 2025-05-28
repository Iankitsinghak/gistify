const Result = ({ data }) => {
  if (!data || !data.summary) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(data.summary);
    synth.speak(utter);
  };

  const download = async (type) => {
    const res = await fetch(`http://localhost:5000/download/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: data.summary }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary.${type}`;
    a.click();
  };

  const highlightedHTML = data.highlighted.replace(/\*(.*?)\*/g, '<mark>$1</mark>');

  return (
    <div className="result-container">
      <h2>Summarization Result</h2>

      <div
        className="summary-text"
        dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      />

      <div className="keywords">
        <strong>Keywords:</strong> {data.keywords.join(', ')}
      </div>

      <div className="stats">
        <p>Original length: {data.original_length || '—'} characters</p>
        <p>Summary length: {data.summary.length} characters</p>
        {data.original_length && (
          <p>Reduction: {Math.round((1 - data.summary.length / data.original_length) * 100)}%</p>
        )}
      </div>

      <div className="actions">
        <button onClick={speak}>🔊 Speak</button>
        <button onClick={() => download('txt')}>⬇️ TXT</button>
        <button onClick={() => download('pdf')}>⬇️ PDF</button>
      </div>
    </div>
  );
};

export default Result;
