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

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in the environment.")

app = Flask(__name__)
CORS(app)  # Open CORS for all origins (adjust in production)

app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()

def extract_text_from_webpage(url):
    try:
        res = httpx.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        for tag in soup(['script', 'style']):
            tag.decompose()
        return soup.get_text(separator='\n').strip()
    except:
        return ""

def extract_keywords(summary):
    words = re.findall(r'\b\w{6,}\b', summary)
    return list(set(words))[:10]

def highlight_keywords(text, keywords):
    for word in keywords:
        pattern = re.compile(rf'\b({re.escape(word)})\b', re.IGNORECASE)
        text = pattern.sub(r'*\1*', text)
    return text

def convert_text_to_pdf(text, path):
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    try:
        pdf.set_font("Arial", size=12)
    except:
        pdf.set_font("Helvetica", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 10, line)
    pdf.output(path)

def get_event_loop():
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.new_event_loop()

def run_async(coro):
    loop = get_event_loop()
    return loop.run_until_complete(coro)

async def fetch_pdf_text_from_url(url):
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            pdf_path = os.path.join(tempfile.gettempdir(), "from_url.pdf")
            with open(pdf_path, "wb") as f:
                f.write(res.content)
            return extract_text_from_pdf(pdf_path)
    return ""

async def generate_summary_with_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = {"contents": [{"parts": [{"text": prompt[:10000]}]}]}  # max 10k chars

    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, params=params, json=data)
        if res.status_code == 200:
            res_json = res.json()
            try:
                return res_json["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                return "Error: Unexpected Gemini API response"
        else:
            return f"Error: Gemini API status {res.status_code}"
    return "Error: Failed to generate summary"

@app.route('/summarize', methods=['POST'])
def summarize():
    text_data = ""

    if "file" in request.files:
        file = request.files["file"]
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            text_data = extract_text_from_pdf(filepath)

    elif request.json:
        data = request.json
        if "pdfUrl" in data:
            text_data = run_async(fetch_pdf_text_from_url(data["pdfUrl"]))
        elif "text" in data:
            text_data = data["text"]
        elif "webpageUrl" in data:
            text_data = extract_text_from_webpage(data["webpageUrl"])

    if not text_data:
        return jsonify({"error": "No valid input provided"}), 400

    summary = run_async(generate_summary_with_gemini(text_data))
    keywords = extract_keywords(summary)
    highlighted = highlight_keywords(summary, keywords)

    return jsonify({
        "summary": summary,
        "highlighted": highlighted,
        "keywords": keywords,
        "original_length": len(text_data),
        "summary_length": len(summary)
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
