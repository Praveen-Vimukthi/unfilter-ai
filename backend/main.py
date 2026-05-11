import io
import numpy as np
import joblib
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI(title="Unfilter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your frontend origin in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load model once at startup
# ---------------------------------------------------------------------------
try:
    model = joblib.load("model.pkl")
    print("✅ model.pkl loaded")
except FileNotFoundError:
    raise RuntimeError(
        "model_2.pkl not found. Place it in the same directory as main.py."
    )


# ---------------------------------------------------------------------------
# Image helpers (ported directly from app.py)
# ---------------------------------------------------------------------------

def resize_keep_ratio(img: np.ndarray, target_size: int = 256) -> np.ndarray:
    h, w = img.shape[:2]
    scale = target_size / min(h, w)
    new_h = int(round(h * scale))
    new_w = int(round(w * scale))

    img = np.array(Image.fromarray(img).resize((new_w, new_h)))

    if new_h < target_size or new_w < target_size:
        pad_h = max(target_size - new_h, 0)
        pad_w = max(target_size - new_w, 0)
        img = np.pad(img, ((0, pad_h), (0, pad_w), (0, 0)), mode="edge")
        new_h, new_w = img.shape[:2]

    start_h = (new_h - target_size) // 2
    start_w = (new_w - target_size) // 2
    return img[start_h : start_h + target_size, start_w : start_w + target_size]


def extract_patches(img: np.ndarray, patch_size: int = 7) -> np.ndarray:
    h, w, _ = img.shape
    pad = patch_size // 2
    padded = np.pad(img, ((pad, pad), (pad, pad), (0, 0)), mode="reflect")
    patches = []
    for i in range(h):
        for j in range(w):
            patch = padded[i : i + patch_size, j : j + patch_size]
            patches.append(patch.flatten())
    return np.array(patches)


def predict_image(pil_img: Image.Image) -> Image.Image:
    img_array = np.array(pil_img.convert("RGB"))
    img_array = resize_keep_ratio(img_array)           # → (256, 256, 3)
    img_norm  = img_array / 255.0
    patches   = extract_patches(img_norm)              # → (N, patch_size²×3)
    predicted = model.predict(patches)                 # → (N, 3)
    predicted = predicted.reshape(img_array.shape)     # → (256, 256, 3)
    predicted = np.clip(predicted * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(predicted)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post(
    "/predict",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"image/jpeg": {}},
            "description": "The filter-removed image as a JPEG file download.",
        }
    },
)
async def predict(file: UploadFile = File(...)):
    """
    Accept an uploaded image, run the ML model, and return the restored
    image as a downloadable JPEG.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Upload an image.",
        )

    raw = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode the uploaded image.")

    try:
        result_img = predict_image(pil_img)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    buf = io.BytesIO()
    result_img.save(buf, format="JPEG", quality=92)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/jpeg",
        headers={"Content-Disposition": 'attachment; filename="unfiltered.jpg"'},
    )
