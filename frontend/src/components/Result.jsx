// src/components/Result.jsx
const Result = ({ data }) => {
  return (
    <div className="result-box">
      <h2>Summary</h2>
      <p className="highlighted-text">{data.highlighted}</p>
      <div className="summary-meta">
        <p><strong>Original Length:</strong> {data.original_length}</p>
        <p><strong>Summary Length:</strong> {data.summary_length}</p>
        <p><strong>Keywords:</strong> {data.keywords.join(', ')}</p>
      </div>
    </div>
  );
};

export default Result;
