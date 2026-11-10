"""Fetch public web pages and turn their visible text into string chunks."""

from __future__ import annotations

import ipaddress
import base64
import re
import socket
import sys
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import requests
from flask import jsonify, request

from .context import EXPECTED_API_KEY, client


MAX_RESPONSE_BYTES = 2_000_000
MAX_CHUNKS = 30
CHUNK_SIZE = 4_000
IGNORED_TAGS = {"script", "style", "noscript", "svg", "canvas", "iframe", "nav", "footer"}


class _VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._ignored_depth = 0
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in IGNORED_TAGS:
            self._ignored_depth += 1
        if tag == "title":
            self._in_title = True
        if tag in {"p", "div", "section", "article", "main", "li", "h1", "h2", "h3", "h4", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in IGNORED_TAGS and self._ignored_depth:
            self._ignored_depth -= 1
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._ignored_depth:
            return
        if self._in_title:
            self.title += data
        self.parts.append(data)


def _is_public_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    try:
        addresses = socket.getaddrinfo(parsed.hostname, None, type=socket.SOCK_STREAM)
        return bool(addresses) and all(ipaddress.ip_address(item[4][0]).is_global for item in addresses)
    except (socket.gaierror, ValueError):
        return False


def _fetch_public_page(url: str) -> str:
    current_url = url
    for _ in range(4):
        if not _is_public_url(current_url):
            raise ValueError("Only publicly accessible http(s) URLs are allowed")
        response = requests.get(current_url, headers={"User-Agent": "LCCB-AI-Link-Reader/1.0"}, timeout=(5, 15), allow_redirects=False, stream=True)
        if 300 <= response.status_code < 400 and response.headers.get("location"):
            current_url = urljoin(current_url, response.headers["location"])
            continue
        response.raise_for_status()
        content_type = response.headers.get("content-type", "").lower()
        if "html" not in content_type and "text/plain" not in content_type:
            raise ValueError("The URL must return an HTML or plain-text page")
        body = bytearray()
        for piece in response.iter_content(chunk_size=16_384):
            body.extend(piece)
            if len(body) > MAX_RESPONSE_BYTES:
                raise ValueError("The web page is too large to process")
        return body.decode(response.encoding or "utf-8", errors="replace")
    raise ValueError("The URL redirected too many times")


def _to_chunks(html: str) -> tuple[str, list[str]]:
    parser = _VisibleTextParser()
    parser.feed(html)
    text = unescape(" ".join(parser.parts))
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    if not text:
        raise ValueError("No readable text was found on the web page")
    chunks = []
    while text and len(chunks) < MAX_CHUNKS:
        if len(text) <= CHUNK_SIZE:
            chunks.append(text)
            break
        split_at = max(text.rfind(". ", 0, CHUNK_SIZE), text.rfind("\n", 0, CHUNK_SIZE))
        split_at = split_at + 1 if split_at > CHUNK_SIZE // 2 else CHUNK_SIZE
        chunks.append(text[:split_at].strip())
        text = text[split_at:].strip()
    return re.sub(r"\s+", " ", parser.title).strip(), chunks


def _pdf_from_text(title: str, content: list[str]) -> bytes:
    """Build a small, dependency-free text PDF from extracted web-page content."""
    source = "\n\n".join(content)
    lines = []
    for paragraph in source.splitlines():
        paragraph = paragraph.strip()
        while paragraph:
            lines.append(paragraph[:90])
            paragraph = paragraph[90:]
    if not lines:
        lines = ["No readable text was found on this web page."]

    page_lines = [lines[index:index + 46] for index in range(0, len(lines), 46)]
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>", None, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    page_ids = []

    def pdf_text(value: str) -> bytes:
        return value.encode("latin-1", "replace").replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)")

    for page in page_lines:
        content_stream = b"BT /F1 10 Tf 50 770 Td 13 TL "
        for line in page:
            content_stream += b"(" + pdf_text(line) + b") Tj T* "
        content_stream += b"ET"
        content_id = len(objects) + 1
        objects.append(b"<< /Length " + str(len(content_stream)).encode() + b" >>\nstream\n" + content_stream + b"\nendstream")
        page_id = len(objects) + 1
        page_ids.append(page_id)
        objects.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents " + str(content_id).encode() + b" 0 R >>")

    objects[1] = b"<< /Type /Pages /Kids [" + b" ".join(f"{page_id} 0 R".encode() for page_id in page_ids) + b"] /Count " + str(len(page_ids)).encode() + b" >>"
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode())
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    output.extend(b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:]))
    output.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(output)


def convert_link_chatbot():
    """Return the supplied page as an array of visible-text strings."""
    try:
        data = request.get_json(silent=True) or {}
        if data.get("token") != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        url = str(data.get("url", "")).strip()
        if not url:
            return jsonify({"success": False, "error": "A URL is required"}), 400
        title, content = _to_chunks(_fetch_public_page(url))
        return jsonify({"success": True, "title": title, "content": content})
    except requests.RequestException as error:
        return jsonify({"success": False, "error": f"Could not fetch the URL: {error}"}), 422
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 422
    except Exception as error:
        print("Link conversion error:", error, file=sys.stderr)
        return jsonify({"success": False, "error": "Failed to convert the web page"}), 500


def convert_link_to_pdf_chatbot():
    """Fetch a web page and return it as a PDF so it follows the normal PDF workflow."""
    try:
        data = request.get_json(silent=True) or {}
        if data.get("token") != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        url = str(data.get("url", "")).strip()
        if not url:
            return jsonify({"success": False, "error": "A URL is required"}), 400
        title, content = _to_chunks(_fetch_public_page(url))
        safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "_", title or urlparse(url).hostname or "web_page").strip("._")[:100] or "web_page"
        pdf = _pdf_from_text(title, content)
        return jsonify({
            "success": True,
            "title": title,
            "file_name": f"{safe_name}.pdf",
            "pdf_base64": base64.b64encode(pdf).decode("ascii"),
        })
    except requests.RequestException as error:
        return jsonify({"success": False, "error": f"Could not fetch the URL: {error}"}), 422
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 422
    except Exception as error:
        print("Link PDF conversion error:", error, file=sys.stderr)
        return jsonify({"success": False, "error": "Failed to convert the web page to PDF"}), 500


def generate_link_chatbot():
    """Generate a response using only text chunks returned by convert_link_chatbot."""
    try:
        data = request.get_json(silent=True) or {}
        if data.get("token") != EXPECTED_API_KEY:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        prompt = str(data.get("prompt", "")).strip()
        content = data.get("content")
        if not prompt:
            return jsonify({"success": False, "error": "Prompt is required"}), 400
        if not isinstance(content, list) or not content or not all(isinstance(item, str) for item in content):
            return jsonify({"success": False, "error": "content must be a non-empty string array"}), 400
        documents = "\n\n".join(item.strip() for item in content if item.strip())[:120_000]
        if not documents:
            return jsonify({"success": False, "error": "No usable page content was supplied"}), 400
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Answer only from the supplied web-page content. Do not invent facts."},
                {"role": "user", "content": f"Web-page content:\n{documents}\n\nTask:\n{prompt}"},
            ],
            temperature=0.2,
            max_tokens=1_500,
        )
        return jsonify({"success": True, "markdown": response.choices[0].message.content or ""})
    except Exception as error:
        print("Link generation error:", error, file=sys.stderr)
        return jsonify({"success": False, "error": "Failed to generate a response from the web page"}), 500
