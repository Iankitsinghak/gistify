// src/utils/api.js
const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const summarize = async ({ file, pdfUrl, text, webpageUrl }) => {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  }

  const body = pdfUrl ? { pdfUrl } : text ? { text } : { webpageUrl };

  const res = await fetch(`${BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await res.json();
};
