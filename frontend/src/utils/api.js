const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const summarize = async ({ text, pdfUrl, file }) => {
  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        body: formData,
      });
    } else {
      const body = pdfUrl ? { pdfUrl } : { text };

      response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { error: error.message };
  }
};
