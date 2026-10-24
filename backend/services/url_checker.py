import ipaddress, re
from urllib.parse import urlsplit, urlunsplit
from config import Config

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy"}
SUSPICIOUS_TERMS = ("login", "verify", "secure", "update", "wallet", "kyc", "payment", "account")

def check_url(raw_url):
    value = (raw_url or "").strip()
    if not value or len(value) > 2048:
        return {"classification": "invalid", "risk_level": "unknown", "risk_score": None,
                "signals": [], "uncertainty": "Provide a valid URL up to 2048 characters."}
    if not re.match(r"^https?://", value, re.I):
        value = "https://" + value
    try:
        parsed = urlsplit(value)
        host = (parsed.hostname or "").lower().rstrip(".")
        if parsed.scheme not in ("http", "https") or not host or parsed.username or parsed.password:
            raise ValueError()
        try:
            ipaddress.ip_address(host)
            is_ip = True
        except ValueError:
            is_ip = False
    except Exception:
        return {"classification": "invalid", "risk_level": "unknown", "risk_score": None,
                "signals": [], "uncertainty": "URL could not be parsed safely."}

    signals, score = [], 0
    def add(kind, severity, evidence, points):
        nonlocal score
        signals.append({"type": kind, "severity": severity, "evidence": evidence})
        score += points

    if parsed.scheme == "http":
        add("unencrypted_http", "medium", "The URL uses HTTP rather than HTTPS. HTTPS alone does not prove legitimacy.", 15)
    if is_ip:
        add("ip_host", "high", "The URL uses an IP address instead of a conventional domain name.", 25)
    if "@" in parsed.netloc:
        add("userinfo", "high", "The URL contains user-info syntax that can obscure the actual destination.", 25)
    if host in SHORTENERS:
        add("shortener", "medium", "A URL shortener obscures the final destination.", 15)
    if host.startswith("xn--") or ".xn--" in host:
        add("punycode", "medium", "The domain uses internationalized encoding that merits careful inspection.", 15)
    if host.count("-") >= 3:
        add("hyphenated_domain", "low", "The domain contains several hyphens; this is only a weak signal.", 5)
    if any(term in (host + parsed.path).lower() for term in SUSPICIOUS_TERMS):
        add("sensitive_keyword", "low", "The URL contains a login, verification or payment-related term; this alone does not indicate a scam.", 5)

    # Optional Google Safe Browsing lookup. No URL is fetched directly by this app.
    if Config.SAFE_BROWSING_API_KEY:
        try:
            import requests
            endpoint = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
            payload = {
                "client": {"clientId": "scamshield-ai-prototype", "clientVersion": "1.0"},
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"], "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": value}]
                }
            }
            response = requests.post(endpoint, params={"key": Config.SAFE_BROWSING_API_KEY},
                                     json=payload, timeout=4)
            if response.ok and response.json().get("matches"):
                add("known_threat_match", "high", "A configured threat-intelligence service reported a known threat match.", 100)
            elif not response.ok:
                signals.append({"type": "threat_check_unavailable", "severity": "unknown",
                                "evidence": "Threat-intelligence lookup was unavailable; this URL was not verified."})
        except Exception:
            signals.append({"type": "threat_check_unavailable", "severity": "unknown",
                            "evidence": "Threat-intelligence lookup failed; this URL was not verified."})

    score = min(score, 100)
    if any(s["type"] == "known_threat_match" for s in signals):
        level, classification = "high", "known_malicious"
    elif score >= 35:
        level, classification = "high", "suspicious"
    elif score >= 15:
        level, classification = "medium", "suspicious"
    else:
        level, classification = "low", "no_known_signal"
    return {
        "classification": classification, "risk_level": level, "risk_score": score,
        "signals": signals,
        "recommended_actions": [
            "Do not enter credentials or payment information unless you independently verify the site.",
            "Open the official service by typing its known address or using its official app."
        ],
        "uncertainty": "This checker does not visit the submitted URL. Heuristic signals are not proof of fraud; no known signal does not mean a URL is safe.",
        "model_version": "url-rules-v1"
    }
