export const summarize = async ({ file, pdfUrl, text }) => {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
    const res = await fetch('https://your-backend-url.onrender.com/summarize', {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  }

  const body = pdfUrl ? { pdfUrl } : text ? { text } : {};
  const res = await fetch('https://your-backend-url.onrender.com/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await res.json();
};
