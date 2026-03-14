"""
Campaia — Local Video Generation Service (ModelScope text-to-video-ms-1.7b)

Runs on host GPU (GTX 1650 Ti, 4 GB VRAM, fp16).
Exposes POST /generate → returns video bytes (mp4).

Start:
  source scripts/local-video-env/bin/activate
  python scripts/local_video_service.py

Backend connects via STABLE_VIDEO_URL=http://localhost:8001
"""

import io
import os
import logging
import tempfile
from contextlib import asynccontextmanager

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("local-video")

pipe = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipe
    from diffusers import DiffusionPipeline
    from diffusers.utils import export_to_video

    logger.info("Loading ModelScope text-to-video-ms-1.7b (fp16 → float32 + sequential_cpu_offload)…")
    pipe = DiffusionPipeline.from_pretrained(
        "damo-vilab/text-to-video-ms-1.7b",
        torch_dtype=torch.float16,
        variant="fp16",
    )
    # Convert to float32 to avoid NaN on GTX 1650 Ti, using cached fp16 weights
    pipe = pipe.to(torch.float32)
    pipe.enable_sequential_cpu_offload()
    pipe.enable_attention_slicing("max")
    pipe.vae.enable_slicing()
    logger.info("Model loaded (fp16→f32 + sequential_cpu_offload). GPU idle VRAM: %.0f MB", torch.cuda.memory_allocated() / 1e6)
    yield
    del pipe
    torch.cuda.empty_cache()


app = FastAPI(title="Campaia Local Video AI", lifespan=lifespan)


class GenerateRequest(BaseModel):
    prompt: str
    num_frames: int = 16
    width: int = 192
    height: int = 192
    num_inference_steps: int = 20


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
        "model": "damo-vilab/text-to-video-ms-1.7b",
        "vram_used_mb": round(torch.cuda.memory_allocated() / 1e6, 1) if torch.cuda.is_available() else 0,
    }


@app.post("/generate")
async def generate(req: GenerateRequest):
    if pipe is None:
        raise HTTPException(503, "Model not loaded yet")
    from diffusers.utils import export_to_video

    logger.info("Generating: %s", req.prompt[:80])
    try:
        torch.cuda.empty_cache()
        with torch.inference_mode():
            result = pipe(
                req.prompt,
                num_frames=req.num_frames,
                width=req.width,
                height=req.height,
                num_inference_steps=req.num_inference_steps,
            )
        frames = result.frames[0]
        import numpy as np
        # Fix NaN/inf from fp16 — clamp and convert to uint8 manually
        clean_frames = []
        for frame in frames:
            if hasattr(frame, 'numpy'):
                f = frame.float().cpu().numpy()
            elif isinstance(frame, np.ndarray):
                f = frame.astype(np.float32)
            else:
                f = np.array(frame, dtype=np.float32)
            f = np.nan_to_num(f, nan=0.0, posinf=1.0, neginf=0.0)
            f = np.clip(f, 0.0, 1.0)
            clean_frames.append((f * 255).astype(np.uint8))

        import imageio
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp.close()
        writer = imageio.get_writer(tmp.name, fps=8, codec="libx264", quality=8)
        for cf in clean_frames:
            writer.append_data(cf)
        writer.close()
        tmp.close()
        with open(tmp.name, "rb") as f:
            data = f.read()
        os.unlink(tmp.name)
        logger.info("Done — %d bytes", len(data))
        return StreamingResponse(io.BytesIO(data), media_type="video/mp4")
    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        raise HTTPException(507, "GPU out of memory — try smaller resolution")
    except Exception as e:
        logger.error("Generation failed: %s", e)
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
