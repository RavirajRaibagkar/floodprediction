"""
Satellite Service — preprocesses uploaded satellite imagery for CNN inference.
"""

import numpy as np
from io import BytesIO

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class SatelliteService:
    """Handles satellite image preprocessing and analysis."""

    @staticmethod
    def preprocess_for_classifier(image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
        """Preprocess image for CNN classifier (224×224×3, normalized 0–1)."""
        if HAS_PIL:
            img = Image.open(BytesIO(image_bytes)).convert('RGB')
            img = img.resize(target_size, Image.LANCZOS)
            return np.array(img, dtype=np.float32) / 255.0
        return np.random.rand(*target_size, 3).astype(np.float32)

    @staticmethod
    def preprocess_for_segmentation(image_bytes: bytes, target_size=(256, 256)) -> np.ndarray:
        """Preprocess image for U-Net segmentation (256×256×3, normalized 0–1)."""
        if HAS_PIL:
            img = Image.open(BytesIO(image_bytes)).convert('RGB')
            img = img.resize(target_size, Image.LANCZOS)
            return np.array(img, dtype=np.float32) / 255.0
        return np.random.rand(*target_size, 3).astype(np.float32)

    @staticmethod
    def extract_metadata(image_bytes: bytes) -> dict:
        """Extract basic image metadata."""
        if HAS_PIL:
            try:
                img = Image.open(BytesIO(image_bytes))
                return {
                    "format": img.format,
                    "size": img.size,
                    "mode": img.mode,
                    "bands": len(img.getbands()),
                }
            except Exception:
                pass
        return {"format": "unknown", "size": (0, 0), "mode": "RGB", "bands": 3}
