const Result = ({ data }) => {
  const handleDownload = async (type) => {
    const res = await fetch(`http://localhost:5000/download/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: data.summary }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary.${type}`;
    a.click();
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(data.summary);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="result">
      <h2>Summary</h2>
      <p>{data.highlighted}</p>

      <h3>Keywords</h3>
      <ul>
        {data.keywords.map((k, i) => (
          <li key={i}>{k}</li>
        ))}
      </ul>

      <button onClick={() => handleDownload('txt')}>Download .txt</button>
      <button onClick={() => handleDownload('pdf')}>Download .pdf</button>
      <button onClick={speak}>🔊 Listen</button>
    </div>
  );
};

export default Result;
