import os
import re
import fitz  # PyMuPDF
import tempfile
from fpdf import FPDF
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename
import httpx
import asyncio

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in .env")

app = Flask(__name__)
CORS(app)

# Upload config
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

# --- Utilities ---
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

def highlight_keywords(text, keywords):
    for word in keywords:
        pattern = re.compile(rf'\b({re.escape(word)})\b', re.IGNORECASE)
        text = pattern.sub(r'*\1*', text)
    return text

def extract_keywords(text):
    words = re.findall(r'\b\w{6,}\b', text)
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
    pdf.set_font("Arial", size=12)
    for line in text.split('\n'):
        pdf.multi_cell(0, 10, line)
    pdf.output(path)

def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

# --- Async ---
async def fetch_pdf_text_from_url(url):
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            path = os.path.join(tempfile.gettempdir(), "temp_url_pdf.pdf")
            with open(path, "wb") as f:
                f.write(res.content)
            return extract_text_from_pdf(path)
    return ""

async def generate_summary_with_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = {"contents": [{"parts": [{"text": prompt[:10000]}]}]}

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, params=params, json=data)
            if res.status_code == 200:
                res_json = res.json()
                return res_json["candidates"][0]["content"]["parts"][0]["text"]
            return f"Error: Gemini API status {res.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"

# --- Routes ---
@app.route('/summarize', methods=['POST'])
def summarize():
    text_data = ""

    if "file" in request.files:
        file = request.files["file"]
        if file and allowed_file(file.filename):
            path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(file.filename))
            file.save(path)
            text_data = extract_text_from_pdf(path)
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

@app.route("/download/txt", methods=["POST"])
def download_txt():
    text = request.json.get("text", "")
    path = save_temp_file("summary.txt", text)
    return send_file(path, as_attachment=True, mimetype='text/plain')

@app.route("/download/pdf", methods=["POST"])
def download_pdf():
    text = request.json.get("text", "")
    path = os.path.join(tempfile.gettempdir(), "summary.pdf")
    convert_text_to_pdf(text, path)
    return send_file(path, as_attachment=True, mimetype='application/pdf')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
