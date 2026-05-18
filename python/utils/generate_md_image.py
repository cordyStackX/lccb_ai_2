import base64
import sys
import json
from flask import request, jsonify, Response, stream_with_context
from .context import EXPECTED_API_KEY, client


def _parse_image_request():
	received_token = None
	image_file = None
	prompt = None
	last_markdown = None
	user_reply = None
	image_url = None

	if request.content_type and request.content_type.startswith("multipart/form-data"):
		image_file = request.files.get("image") or request.files.get("file")
		received_token = request.form.get("token")
		prompt = request.form.get("prompt")
		last_markdown = request.form.get("last_markdown")
		user_reply = request.form.get("user_reply")
		image_url = request.form.get("image_url")
	else:
		data = request.json or {}
		received_token = data.get("token")
		prompt = data.get("prompt")
		last_markdown = data.get("last_markdown")
		user_reply = data.get("user_reply")
		image_url = data.get("image_url")

	if received_token != EXPECTED_API_KEY:
		return None, None, (jsonify({"success": False, "error": "Unauthorized"}), 401)

	if not image_file and not image_url:
		return None, None, (
			jsonify({
				"success": False,
				"error": "Image file or image_url is required.",
			}),
			400,
		)

	return image_file, image_url, prompt, last_markdown, user_reply, None


def _to_data_url(file_storage, image_url):
	if image_url:
		return "image", "image/url", image_url

	filename = file_storage.filename or "image"
	content_type = file_storage.mimetype or "application/octet-stream"
	file_bytes = file_storage.read()
	encoded = base64.b64encode(file_bytes).decode("utf-8")
	return filename, content_type, f"data:{content_type};base64,{encoded}"


def _build_messages(prompt, data_url, last_markdown, user_reply):
	clean_prompt = (prompt or "").strip()
	if not clean_prompt:
		clean_prompt = "Describe the image."

	context_parts = []
	if last_markdown:
		context_parts.append(f"Previous assistant reply:\n{last_markdown}")
	if user_reply:
		context_parts.append(f"User follow-up question:\n{user_reply}")

	context_text = "\n\n".join(context_parts)

	system_prompt = (
		"You are LACO, a helpful assistant. Answer using only what is visible in the image. "
		"If the user asks for details that cannot be determined from the image, say you cannot "
		"tell from the image."
	)

	return [
		{"role": "system", "content": system_prompt},
		{
			"role": "user",
			"content": [
				{"type": "text", "text": (clean_prompt + ("\n\n" + context_text if context_text else ""))},
				{"type": "image_url", "image_url": {"url": data_url}},
			],
		},
	]


def generate_md_image():
	try:
		image_file, image_url, prompt, last_markdown, user_reply, error = _parse_image_request()
		if error:
			return error

		_, _, data_url = _to_data_url(image_file, image_url)
		messages = _build_messages(prompt, data_url, last_markdown, user_reply)

		response = client.chat.completions.create(
			model="gpt-4o-mini",
			messages=messages,
			temperature=0.7,
			max_tokens=800,
		)

		md = response.choices[0].message.content or ""

		return jsonify({"success": True, "markdown": md})

	except Exception as e:
		print("OpenAI Error:", e, file=sys.stderr)
		return jsonify({"success": False, "error": str(e)}), 500


def generate_md_image_stream():
	try:
		image_file, image_url, prompt, last_markdown, user_reply, error = _parse_image_request()
		if error:
			return error

		_, _, data_url = _to_data_url(image_file, image_url)
		messages = _build_messages(prompt, data_url, last_markdown, user_reply)

		def event_stream():
			try:
				stream = client.chat.completions.create(
					model="gpt-4o-mini",
					messages=messages,
					temperature=0.7,
					max_tokens=800,
					stream=True,
				)

				for chunk in stream:
					delta = chunk.choices[0].delta.content or ""
					if delta:
						yield f"data: {json.dumps({'text': delta})}\n\n"

				yield f"data: {json.dumps({'done': True})}\n\n"
			except Exception as e:
				yield f"data: {json.dumps({'error': str(e)})}\n\n"

		return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

	except Exception as e:
		print("OpenAI Error:", e, file=sys.stderr)
		return jsonify({"success": False, "error": str(e)}), 500
