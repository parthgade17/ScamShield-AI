
from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)

# Allow the local Vite frontend to call this backend.
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

MAX_MESSAGE_LENGTH = 10000


def analyze_message(message):
    text = message.lower()
    indicators = []

    # Each detector returns an explanation and a risk contribution.
    rules = [
        (
            "Requests sensitive information",
            r"\b(?:otp|one[- ]time password|password|pin|cvv|verification code)\b",
            25,
            "Never share an OTP, password, PIN, or CVV with someone who contacts you."
        ),
        (
            "Uses urgency or pressure",
            r"\b(?:urgent|immediately|right now|act fast|within 24 hours|"
            r"final warning|expires today|last chance)\b",
            15,
            "Pause and verify the request through an official channel."
        ),
        (
            "Threatens account suspension",
            r"\b(?:account blocked|account suspended|account will close|"
            r"account will be blocked|card blocked|kyc expired)\b",
            20,
            "Contact your bank or service provider using its official app or website."
        ),
        (
            "Requests a payment or money transfer",
            r"\b(?:send money|transfer money|pay now|processing fee|"
            r"pay immediately|make a payment|claim fee)\b",
            20,
            "Verify the recipient and payment request independently before paying."
        ),
        (
            "Promises a prize, reward, or unrealistic return",
            r"\b(?:you have won|you won a prize|guaranteed profit|"
            r"free gift|claim your reward|lottery winner|double your money)\b",
            20,
            "Verify the offer with the official organization. Be cautious of upfront fees."
        ),
        (
            "Uses impersonation or account-verification language",
            r"\b(?:verify your account|confirm your identity|"
            r"update your kyc|suspended account|bank representative)\b",
            15,
            "Open the official service directly instead of following instructions in the message."
        ),
        (
            "Contains a web link",
            r"(?:https?://|www\.)",
            10,
            "Inspect the full domain carefully. Do not open unexpected or suspicious links."
        ),
        (
            "Requests remote access or app installation",
            r"\b(?:install anydesk|install teamviewer|remote access|"
            r"screen sharing app|install this apk)\b",
            25,
            "Do not install unknown apps or give strangers remote access to your device."
        ),
        (
            "Requests secrecy or discourages verification",
            r"\b(?:keep this secret|do not tell anyone|don't tell anyone|"
            r"do not contact your bank|don't contact your bank)\b",
            15,
            "Independently verify the request with someone you trust or the official organization."
        ),
    ]

    score = 0
    recommendations = []

    for name, pattern, points, advice in rules:
        if re.search(pattern, text):
            indicators.append({
                "name": name,
                "points": points,
                "evidence": "A matching suspicious phrase or pattern was found."
            })
            score += points
            recommendations.append(advice)

    score = min(score, 100)

    if score >= 70:
        level = "Critical"
        explanation = "Several strong warning indicators were found. Treat this message as potentially fraudulent until independently verified."
    elif score >= 45:
        level = "High"
        explanation = "The message contains multiple or significant scam indicators. Verify it through an official channel."
    elif score >= 20:
        level = "Medium"
        explanation = "Some suspicious indicators were found. Be cautious and verify the sender and request."
    else:
        level = "Low"
        explanation = (
            "Few or no known warning patterns were detected. "
            "This does not prove that the message is safe."
        )

    if not recommendations:
        recommendations.append(
            "If the message asks for money or personal information, verify it "
            "directly with the official organization before responding."
        )

    return {
        "risk_score": score,
        "risk_level": level,
        "explanation": explanation,
        "indicators": indicators,
        "recommendations": recommendations,
        "detection_method": "rule_based"
    }


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "ScamShield Detection API",
        "detection_method": "rule_based"
    })


@app.post("/api/scan")
def scan():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object containing a message."}), 400

    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Please provide a non-empty message."}), 400

    message = message.strip()

    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "error": f"Message must be {MAX_MESSAGE_LENGTH} characters or fewer."
        }), 400

    return jsonify(analyze_message(message))


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Endpoint not found."}), 404


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
