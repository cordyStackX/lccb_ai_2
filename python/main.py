import os
from utils import (
    app, download_file,
    generate_md, generate_md_stream,
    generate_md_sensitive_data, generate_md_sensitive_data_stream,
    generate_md_chatbot, generate_md_chatbot_stream,
    generate_md_summary, generate_tts,
    generate_voice_md, generate_voice_md_stream, generate_voice_md_stream_pdf,
    convert_link_chatbot, convert_link_to_pdf_chatbot, generate_link_chatbot,
    generate_pdf_cache,
    dashboard_analysis,
)

# -----------------------------------------
# ROUTE: Generate Markdown
# -----------------------------------------
@app.route("/generate-md", methods=["POST"])
def generate_md_route():
    return generate_md()


@app.route("/generate-md-stream", methods=["POST"])
def generate_md_stream_route():
    return generate_md_stream()


@app.route("/generate-md-sensitive-data", methods=["POST"])
def generate_md_sensitive_data_route():
    return generate_md_sensitive_data()


@app.route("/generate-md-stream-sensitive-data", methods=["POST"])
def generate_md_stream_sensitive_data_route():
    return generate_md_sensitive_data_stream()


@app.route("/download-file", methods=["POST"])
def download_file_route():
    return download_file()


@app.route("/generate-md-chatbot", methods=["POST"])
def generate_md_chat_bot_route():
    return generate_md_chatbot()


@app.route("/generate-md-chatbot-stream", methods=["POST"])
def generate_md_chat_bot_stream_route():
    return generate_md_chatbot_stream()


@app.route("/generate_md_summary", methods=["POST"])
def generate_md_summary_route():
    return generate_md_summary()


@app.route("/generate-tts", methods=["POST"])
def generate_tts_route():
    return generate_tts()


@app.route("/generate-voice-md", methods=["POST"])
def generate_voice_md_route():
    return generate_voice_md()


@app.route("/generate-voice-md-stream", methods=["POST"])
def generate_voice_md_stream_route():
    return generate_voice_md_stream()


@app.route("/generate-voice-md-stream-pdf", methods=["POST"])
def generate_voice_md_stream_pdf_route():
    return generate_voice_md_stream_pdf()


@app.route("/convert-link-chatbot", methods=["POST"])
def convert_link_chatbot_route():
    return convert_link_chatbot()


@app.route("/convert-link-to-pdf-chatbot", methods=["POST"])
def convert_link_to_pdf_chatbot_route():
    return convert_link_to_pdf_chatbot()


@app.route("/generate-link-chatbot", methods=["POST"])
def generate_link_chatbot_route():
    return generate_link_chatbot()


@app.route("/generate-pdf-cache", methods=["POST"])
def generate_pdf_cache_route():
    return generate_pdf_cache()


@app.route("/dashboard-analysis", methods=["POST"])
def dashboard_analysis_route():
    return dashboard_analysis()


# -----------------------------------------
# Run Server
# -----------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
