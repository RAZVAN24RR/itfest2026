"""
Campaia Engine - Text Generator Service

Uses Ollama for local AI text generation (script generation).
Can be swapped with OpenAI for production if needed.
"""

import httpx
from typing import Literal

from app.core.config import settings


ToneType = Literal["professional", "casual", "viral", "funny"]


TONE_PROMPTS = {
    "professional": "Use a professional, business-like tone. Be clear, concise, and authoritative.",
    "casual": "Use a casual, friendly tone. Be conversational and approachable.",
    "viral": "Use an exciting, attention-grabbing tone. Create urgency and excitement.",
    "funny": "Use a humorous, witty tone. Be creative and entertaining.",
}


def detect_is_romanian(text: str) -> bool:
    """Heuristic to detect Romanian language even without diacritics."""
    if not text:
        return False
    text_lower = text.lower()
    # Check for diacritics
    if any(c in text for c in "ășîțâĂȘÎȚÂ"):
        return True
    # Expanded common Romanian words (with and without space)
    ro_keywords = [
        " si ", " și ", " sa ", " să ", " sunt ", " este ", " pentru ", " de ", " cu ", " la ", 
        " bac ", " examen ", " info ", " pregatiri ", " meditatii ", " curs ", " invata ",
        " un ", " o ", " ca ", " dar ", " nu ", " da ", " mai ", " fost ", " era "
    ]
    return any(ind in f" {text_lower} " for ind in ro_keywords)


class TextGenerator:
    """
    Text generator service using Ollama for local AI.
    
    Can generate:
    - TikTok ad scripts
    - Product descriptions
    - Hashtag suggestions
    - Audience suggestions
    """

    def __init__(self):
        self.base_url = settings.ollama_url
        self.model = settings.ollama_model

    async def _generate(self, prompt: str, system_prompt: str = "") -> str:
        """
        Generate text using Ollama API.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt for context
            
        Returns:
            Generated text
        """
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "system": system_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "num_predict": 512,
                            "num_ctx": 2048,
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "").strip()
            except httpx.HTTPError as e:
                raise RuntimeError(f"Failed to generate text: {str(e)}")

    async def generate_script(
        self,
        product_description: str,
        product_url: str,
        tone: ToneType = "viral",
        duration_seconds: int = 15,
        language: str = "en",
        variants: int = 5,
    ) -> list[str]:
        """Generate ad scripts in the user's language."""
        # FORCED LANGUAGE DETECTION
        is_ro = detect_is_romanian(product_description) or language == "ro"
        
        if is_ro:
            system_prompt = "Ești un copywriter expert. Scrii EXCLUSIV în limba ROMÂNĂ. Nu folosi engleza sub nicio formă."
            full_prompt = f"""[CAMPAIA MARKETING - STRICT: DOAR RECLAME]
Produs/Oferta: "{product_description}"

IMPORTANT: Răspunde direct cu scripturile. Fără introduceri gen "Aici sunt variantele" sau "Iată scripturile".

Scrie 5 scripturi scurte de reclame TikTok:
- Limbă: Română.
- Lungime: 20-30 cuvinte.
- Separator: ### (Pune ### după FIECARE variantă).
- NU pune cifre în fața variantelor.

Exemplu: Te chinui cu temele la info? � Explicăm C++ pe înțelesul tău. Ia 10 la Bac ușor! 🎓 ###
"""
        else:
            system_prompt = "You are an expert copywriter. You write EXCLUSIVELY in ENGLISH."
            full_prompt = f"""[CAMPAIA MARKETING]
Product/Offer: "{product_description}"

Write 5 TikTok ad scripts that stop the scroll.
- Language: English.
- Length: 20-30 words.
- Format: Hook -> Benefit -> CTA.
- Separator: ###

Example: Tired of boring ads? 🙄 Grow your brand with our elite tools. Get started today! 🚀 ###
"""

        response = await self._generate(full_prompt, system_prompt)
        
        # Clean and parse variants from response
        scripts = []
        
        # 1. Split by ###
        raw_parts = response.split("###")
        
        # 2. If it failed to find at least 5 variants, try splitting by newline numbers
        if len([p for p in raw_parts if len(p.strip()) > 15]) < variants:
            import re
            raw_parts = re.split(r'\n\s*\d+[.)]|\d+[.)]', response)

        for part in raw_parts:
            script = self._clean_script(part.strip())
            # Basic quality check: 10+ words or 40+ characters
            if script and (len(script.split()) >= 10 or len(script) > 40):
                scripts.append(script)
        
        # Deduplicate while preserving order
        final_scripts = []
        seen = set()
        for s in scripts:
            if s.lower() not in seen:
                final_scripts.append(s)
                seen.add(s.lower())

        # If we still don't have enough, generate context-aware fallbacks
        if len(final_scripts) < variants:
            context_fallbacks = [
                f"Vrei să afli secretul pentru {product_description}? 🚀 Te așteptăm cu cele mai bune soluții și oferte de nerefuzat! Link în bio. ✨",
                f"Transformă-ți experiența cu {product_description}! � Calitate premium și suport dedicat pentru succesul tău. Comandă acum! �",
                f"Nu mai sta pe gânduri! 🌟 Alege {product_description} și bucură-te de rezultate vizibile imediat. Detalii în descriere. �",
                f"Ești gata pentru o schimbare? ⚡️ {product_description} este exact ce ai nevoie pentru a trece la nivelul următor! �",
                f"Cea mai inteligentă alegere pentru {product_description}! 🏆 Profită de promoția actuală și economisește timp și bani! 🔥"
            ]
            for fb in context_fallbacks:
                if len(final_scripts) >= variants:
                    break
                final_scripts.append(fb)

        return final_scripts[:variants]
    
    def _clean_script(self, text: str) -> str:
        """Clean up a script by removing unwanted prefixes and formatting."""
        if not text:
            return ""
        
        lines = text.split("\n")
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip common unwanted prefixes
            skip_patterns = [
                "here are", "here's", "script variant", "variant ", 
                "**script", "script:", "option ", "version ",
                "---", "###", "```", "[text]", "[varianta", "varianta:",
                "aici sunt", "iata ", "iată ", "iată câteva", "iată 5", "iata 5",
                "versiune", "opțiune", "optiune"
            ]
            lower_line = line.lower()
            if any(pattern in lower_line for pattern in skip_patterns):
                continue
            
            # Remove markdown bold markers
            line = line.replace("**", "")
            
            # Remove numbering at start (1., 2., etc.)
            if len(line) > 2 and line[0].isdigit() and line[1] in ".):":
                line = line[2:].strip()
            if len(line) > 3 and line[0].isdigit() and line[1].isdigit() and line[2] in ".):":
                line = line[3:].strip()
            
            if line:
                cleaned_lines.append(line)
        
        return "\n".join(cleaned_lines)

    async def generate_hashtags(
        self,
        product_description: str,
        count: int = 10,
    ) -> list[str]:
        """
        Generate relevant hashtags for a TikTok ad.
        
        Args:
            product_description: Description of the product/service
            count: Number of hashtags to generate
            
        Returns:
            List of hashtags
        """
        system_prompt = "You are a TikTok marketing expert. Generate trending and relevant hashtags."
        
        prompt = f"""Generate {count} TikTok hashtags for this product/service:

{product_description}

Include a mix of:
- Trending hashtags
- Niche-specific hashtags
- Branded potential hashtags

Return ONLY the hashtags, one per line, each starting with #."""

        response = await self._generate(prompt, system_prompt)
        
        # Parse hashtags from response
        hashtags = []
        for line in response.split("\n"):
            line = line.strip()
            if line.startswith("#"):
                hashtags.append(line)
            elif line and not line.startswith("#"):
                hashtags.append(f"#{line}")
        
        return hashtags[:count]

    async def suggest_audience(
        self,
        product_description: str,
    ) -> dict:
        """
        Suggest target audience for a product.
        
        Args:
            product_description: Description of the product/service
            
        Returns:
            Dictionary with audience suggestions
        """
        system_prompt = "You are a marketing strategist expert in TikTok advertising."
        
        prompt = f"""Analyze this product and suggest the ideal TikTok target audience:

{product_description}

Provide your response in this exact format:
AGE: [age range, e.g., 18-34]
GENDER: [all/male/female/other]
INTERESTS: [comma-separated list of 5 interests]
LOCATIONS: [comma-separated list of suggested locations or "global"]
DESCRIPTION: [2-3 sentence description of the ideal customer]"""

        response = await self._generate(prompt, system_prompt)
        
        # Parse response
        result = {
            "age_range": "18-44",
            "gender": "all",
            "interests": [],
            "locations": ["global"],
            "description": "",
        }
        
        for line in response.split("\n"):
            line = line.strip()
            if line.startswith("AGE:"):
                result["age_range"] = line.replace("AGE:", "").strip()
            elif line.startswith("GENDER:"):
                result["gender"] = line.replace("GENDER:", "").strip().lower()
            elif line.startswith("INTERESTS:"):
                interests = line.replace("INTERESTS:", "").strip()
                result["interests"] = [i.strip() for i in interests.split(",")]
            elif line.startswith("LOCATIONS:"):
                locations = line.replace("LOCATIONS:", "").strip()
                result["locations"] = [l.strip() for l in locations.split(",")]
            elif line.startswith("DESCRIPTION:"):
                result["description"] = line.replace("DESCRIPTION:", "").strip()
        
        return result

    async def generate_marketing_description(
        self,
        product_description: str,
        language: str = "en",
    ) -> str:
        """Generate a high-impact marketing punchline."""
        is_ro = detect_is_romanian(product_description) or language == "ro"
        
        if is_ro:
            system_prompt = "Ești un strateg de brand. Scrii în limba ROMÂNĂ."
            prompt = f"Scrie o frază de marketing (max 25 cuvinte) cu un emoji la final pentru: {product_description}"
        else:
            system_prompt = "You are a brand strategist. You write in ENGLISH."
            prompt = f"Write a marketing sentence (max 25 words) with an emoji at the end for: {product_description}"

        response = await self._generate(prompt, system_prompt)
        return response.strip()

    async def generate_kling_prompt(
        self,
        product_description: str,
        language: str = "en",
    ) -> str:
        """Generate a professional cinematic prompt for Kling AI."""
        prompt = f"""Create a masterpiece cinematic video prompt for Kling AI about: "{product_description}".

Prompt structure (output ONLY this):
Professional cinematic advertisement, 8k resolution, highly detailed, photorealistic. 
Scene: [Describe a professional setting showing the product's value].
Lighting: Volumetric lighting, warm glow, professional studio lighting.
Camera: Slow tracking shot, shallow depth of field, bokeh background, 35mm lens.
Atmosphere: Premium, optimistic, vibrant colors.
NO TEXT, NO LOGOS, just the visual description in English."""

        response = await self._generate(prompt, "")
        return response.strip()

    async def check_available(self) -> bool:
        """Check if Ollama is available and has the model."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
            except httpx.HTTPError:
                return False


# Singleton instance
text_generator = TextGenerator()
