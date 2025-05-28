# top-level imports
import os
import re
import fitz  # PyMuPDF
import tempfile
from fpdf import FPDF
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename
import httpx
import asyncio

# .env setup
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Helpers
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()

async def extract_text_from_pdf_url(url):
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            pdf_path = os.path.join(tempfile.gettempdir(), "from_url.pdf")
            with open(pdf_path, "wb") as f:
                f.write(res.content)
            return extract_text_from_pdf(pdf_path)
    return None

async def generate_summary(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = { "contents": [{ "parts": [{ "text": prompt }] }] }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, params=params, json=data)
        if res.status_code == 200:
            return res.json()["candidates"][0]["content"]["parts"][0]["text"]
        return f"Error: {res.text}"

def highlight_keywords(text, keywords):
    for word in keywords:
        pattern = re.compile(rf'\b({re.escape(word)})\b', re.IGNORECASE)
        text = pattern.sub(r'*\1*', text)
    return text

# Main endpoint
@app.route('/summarize', methods=['POST'])
async def summarize():
    text_data, summary = "", ""
    keywords = []

    if "file" in request.files:
        file = request.files["file"]
        if file and allowed_file(file.filename):
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(file.filename))
            file.save(file_path)
            text_data = extract_text_from_pdf(file_path)

    elif request.json:
        data = request.json
        if "pdfUrl" in data:
            text_data = await extract_text_from_pdf_url(data["pdfUrl"])
        elif "text" in data:
            text_data = data["text"]

    if text_data:
        summary = await generate_summary(text_data)
        keywords = list(set(re.findall(r'\b\w{6,}\b', summary)))[:10]
        highlighted = highlight_keywords(summary, keywords)
        return jsonify({
            "summary": summary,
            "highlighted": highlighted,
            "keywords": keywords
        })

    return jsonify({"error": "No valid input provided"}), 400

@app.route("/download/txt", methods=["POST"])
def download_txt():
    text = request.json.get("text", "")
    path = os.path.join(tempfile.gettempdir(), "summary.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return send_file(path, as_attachment=True)

@app.route("/download/pdf", methods=["POST"])
def download_pdf():
    text = request.json.get("text", "")
    path = os.path.join(tempfile.gettempdir(), "summary.pdf")
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 10, line)
    pdf.output(path)
    return send_file(path, as_attachment=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
