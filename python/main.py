import os
from utils import app, download_file, generate_md, generate_md_chatbot, generate_md_summary, generate_voice_md

# -----------------------------------------
# ROUTE: Generate Markdown
# -----------------------------------------
@app.route("/generate-md", methods=["POST"])
def generate_md_route():
    return generate_md()


@app.route("/download-file", methods=["POST"])
def download_file_route():
    return download_file()

@app.route("/generate-md-chatbot", methods=["POST"])
def generate_md_chat_bot_route():
    return generate_md_chatbot()

@app.route("/generate_md_summary", methods=["POST"])
def generate_md_summary_route():
    return generate_md_summary()


@app.route("/generate-voice-md", methods=["POST"])
def generate_voice_md_route():
    return generate_voice_md()


# -----------------------------------------
# Run Server
# -----------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)