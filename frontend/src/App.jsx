import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function App() {
  const [inputType, setInputType] = useState("text");
  const [text, setText] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [webpageUrl, setWebpageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetState = () => {
    setSummary(null);
    setError(null);
  };

  const handleSummarize = async () => {
    resetState();
    setLoading(true);
    try {
      let response;
      if (inputType === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch(`${API_BASE}/summarize`, {
          method: "POST",
          body: formData,
        });
      } else {
        const body = {};
        if (inputType === "text") body.text = text;
        else if (inputType === "pdfUrl") body.pdfUrl = pdfUrl;
        else if (inputType === "webpageUrl") body.webpageUrl = webpageUrl;

        response = await fetch(`${API_BASE}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize");
      }
      setSummary(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.app}>
      <h1>PDF/Text/Webpage Summarizer</h1>

      <div style={styles.inputSelector}>
        <label>
          <input
            type="radio"
            value="text"
            checked={inputType === "text"}
            onChange={() => {
              setInputType("text");
              resetState();
            }}
          />{" "}
          Enter Text
        </label>
        <label>
          <input
            type="radio"
            value="pdfUrl"
            checked={inputType === "pdfUrl"}
            onChange={() => {
              setInputType("pdfUrl");
              resetState();
            }}
          />{" "}
          PDF URL
        </label>
        <label>
          <input
            type="radio"
            value="webpageUrl"
            checked={inputType === "webpageUrl"}
            onChange={() => {
              setInputType("webpageUrl");
              resetState();
            }}
          />{" "}
          Webpage URL
        </label>
        <label>
          <input
            type="radio"
            value="file"
            checked={inputType === "file"}
            onChange={() => {
              setInputType("file");
              resetState();
            }}
          />{" "}
          Upload PDF File
        </label>
      </div>

      {inputType === "text" && (
        <textarea
          placeholder="Enter text to summarize"
          style={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {inputType === "pdfUrl" && (
        <input
          type="url"
          placeholder="Enter PDF URL"
          style={styles.input}
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
        />
      )}

      {inputType === "webpageUrl" && (
        <input
          type="url"
          placeholder="Enter webpage URL"
          style={styles.input}
          value={webpageUrl}
          onChange={(e) => setWebpageUrl(e.target.value)}
        />
      )}

      {inputType === "file" && (
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
        />
      )}

      <button onClick={handleSummarize} style={styles.button} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {error && <p style={styles.error}>⚠️ {error}</p>}

      {summary && (
        <div style={styles.result}>
          <h2>Summary</h2>
          <pre style={styles.pre}>{summary.summary}</pre>
          {summary.keywords && summary.keywords.length > 0 && (
            <>
              <h3>Keywords:</h3>
              <ul>
                {summary.keywords.map((kw, i) => (
                  <li key={i}>{kw}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  inputSelector: {
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  textarea: {
    width: "100%",
    height: 150,
    fontSize: 16,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  input: {
    width: "100%",
    fontSize: 16,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  button: {
    padding: "12px 24px",
    fontSize: 18,
    cursor: "pointer",
    borderRadius: 5,
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  result: {
    textAlign: "left",
    marginTop: 30,
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
};
