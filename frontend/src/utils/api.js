// src/utils/api.js
export const summarize = async ({ file, pdfUrl, text, webpageUrl }) => {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
    const res = await fetch('http://localhost:5000/summarize', {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  }

  const body = pdfUrl
    ? { pdfUrl }
    : text
    ? { text }
    : { webpageUrl };

  const res = await fetch('http://localhost:5000/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return await res.json();
};
