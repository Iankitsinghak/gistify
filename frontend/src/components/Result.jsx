const Result = ({ data }) => (
  <div className="result-container">
    <h2>Summary</h2>
    <p>{data.highlighted}</p>
    <h4>Keywords:</h4>
    <ul>
      {data.keywords.map((word, i) => (
        <li key={i}>{word}</li>
      ))}
    </ul>
    <p>
      🔤 Original Length: {data.original_length} | ✂️ Summary Length: {data.summary_length}
    </p>
  </div>
);

export default Result;
