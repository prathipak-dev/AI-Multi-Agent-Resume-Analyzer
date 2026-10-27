import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("GroqService")

class GroqService:
    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def api_key(self) -> str:
        return settings.GROQ_API_KEY

    @property
    def model(self) -> str:
        return settings.GROQ_MODEL

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1200
    ) -> Dict[str, Any]:
        """Calls Groq API requesting JSON format. Handles fallback gracefully."""
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set. Using smart heuristic fallback.")
            return {}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({
            "role": "user",
            "content": f"{prompt}\n\nIMPORTANT: Respond strictly in valid JSON format."
        })

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)
                elif response.status_code == 429:
                    logger.warning("Groq rate limit (429) hit, utilizing heuristic fallback.")
                    return {}
                elif response.status_code == 400:
                    logger.error(f"Groq 400 bad request: {response.text}")
                    # Try with smaller token count
                    payload["max_tokens"] = 800
                    payload.pop("response_format", None)
                    response2 = await client.post(self.api_url, headers=headers, json=payload)
                    if response2.status_code == 200:
                        data = response2.json()
                        content = data["choices"][0]["message"]["content"]
                        # Try to extract JSON from content
                        try:
                            return json.loads(content)
                        except json.JSONDecodeError:
                            import re
                            match = re.search(r'\{.*\}', content, re.DOTALL)
                            if match:
                                return json.loads(match.group())
                    return {}
                else:
                    logger.error(f"Groq API error {response.status_code}: {response.text}")
                    return {}
        except Exception as e:
            logger.warning(f"Exception invoking Groq API: {e}")
            return {}

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000
    ) -> str:
        """Calls Groq API for standard text generation (Cover letters, Emails, Roadmaps)."""
        if not self.api_key:
            return "Groq API key not configured. Please set GROQ_API_KEY in your .env file."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                elif response.status_code == 429:
                    logger.warning("Groq rate limit hit during text generation, using fallback.")
                    return "AI service is temporarily rate-limited. Please try again in a moment."
                return f"AI text generation unavailable (status {response.status_code})."
        except Exception as e:
            logger.warning(f"Groq text generation error: {e}")
            return "AI text generation encountered an error. Please check your API configuration."


groq_service = GroqService()
