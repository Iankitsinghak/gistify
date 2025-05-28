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
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in the environment.")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (adjust for production)

# Config
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB max file size

# Helpers
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
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        for tag in soup(['script', 'style']):
            tag.decompose()
        return soup.get_text(separator='\n').strip()
    except Exception as e:
        logging.error(f"Error extracting webpage text: {e}")
        return ""

def highlight_keywords(text, keywords):
    for word in keywords:
        pattern = re.compile(rf'\b({re.escape(word)})\b', re.IGNORECASE)
        text = pattern.sub(r'*\1*', text)
    return text

def extract_keywords(summary):
    words = re.findall(r'\b\w{6,}\b', summary)
    return list(set(words))[:10]

def save_temp_file(name, content, mode='w', encoding='utf-8'):
    path = os.path.join(tempfile.gettempdir(), name)
    with open(path, mode, encoding=encoding) as f:
        f.write(content)
    return path

def convert_text_to_pdf(text, path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    try:
        pdf.set_font("Arial", size=12)
    except Exception:
        pdf.set_font("Helvetica", size=12)
    for line in text.split("\n"):
        pdf.multi_cell(0, 10, line)
    pdf.output(path)

# Async Helpers
def get_event_loop():
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.new_event_loop()

def run_async(coro):
    loop = get_event_loop()
    if loop.is_running():
        # If event loop is running (e.g. in some WSGI servers), create a new one
        new_loop = asyncio.new_event_loop()
        return new_loop.run_until_complete(coro)
    else:
        return loop.run_until_complete(coro)

async def fetch_pdf_text_from_url(url):
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url)
            res.raise_for_status()
            pdf_path = os.path.join(tempfile.gettempdir(), "from_url.pdf")
            with open(pdf_path, "wb") as f:
                f.write(res.content)
            return extract_text_from_pdf(pdf_path)
        except Exception as e:
            logging.error(f"Error fetching PDF from URL: {e}")
            return ""

async def generate_summary_with_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = {"contents": [{"parts": [{"text": prompt[:10000]}]}]}

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, params=params, json=data)
            res.raise_for_status()
            res_json = res.json()
            try:
                return res_json["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                return "Error: Unexpected Gemini API response format"
        except Exception as e:
            logging.error(f"Error contacting Gemini API: {e}")
            return f"Error contacting Gemini API: {str(e)}"

# Routes
@app.route('/summarize', methods=['POST'])
def summarize():
    text_data = ""

    if "file" in request.files:
        file = request.files["file"]
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)
            text_data = extract_text_from_pdf(file_path)

    elif request.is_json:
        data = request.get_json()
        if "pdfUrl" in data:
            text_data = run_async(fetch_pdf_text_from_url(data["pdfUrl"]))
        elif "text" in data:
            text_data = data["text"]
        elif "webpageUrl" in data:
            text_data = extract_text_from_webpage(data["webpageUrl"])

    if not text_data:
        return jsonify({"error": "No valid input provided or unable to extract text"}), 400

    summary = run_async(generate_summary_with_gemini(text_data))
    if summary.startswith("Error"):
        return jsonify({"error": summary}), 500

    keywords = extract_keywords(summary)
    highlighted = highlight_keywords(summary, keywords)

    return jsonify({
        "summary": summary,
        "highlighted": highlighted,
        "keywords": keywords,
        "original_length": len(text_data),
        "summary_length": len(summary)
    })

@app.route("/download/txt", methods=["POST"])
def download_txt():
    text = request.json.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    path = save_temp_file("summary.txt", text)
    return send_file(path, as_attachment=True, mimetype='text/plain')

@app.route("/download/pdf", methods=["POST"])
def download_pdf():
    text = request.json.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    path = os.path.join(tempfile.gettempdir(), "summary.pdf")
    convert_text_to_pdf(text, path)
    return send_file(path, as_attachment=True, mimetype='application/pdf')

if __name__ == "__main__":
    # Use 0.0.0.0 for accessibility on Render/Vercel, port from env var or default 5000
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
