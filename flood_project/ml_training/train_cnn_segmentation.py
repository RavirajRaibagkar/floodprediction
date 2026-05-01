"""
Training script for CNN Flood Segmentation (U-Net).
Input: 256×256×3 satellite images with 256×256 binary flood masks.
"""

import os
import numpy as np

try:
    import tensorflow as tf
    from tensorflow import keras
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("⚠️  TensorFlow not installed. Install with: pip install tensorflow")

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from models.cnn_flood_segmentation import build_unet


def create_sample_data(n_samples=100):
    """Generate synthetic training data for U-Net segmentation."""
    X = np.random.rand(n_samples, 256, 256, 3).astype(np.float32)
    y = np.zeros((n_samples, 256, 256, 1), dtype=np.float32)

    for i in range(n_samples):
        # Create random "flood" regions
        n_regions = np.random.randint(1, 4)
        for _ in range(n_regions):
            cx, cy = np.random.randint(50, 200, 2)
            rx, ry = np.random.randint(20, 60, 2)
            yy, xx = np.ogrid[-cx:256 - cx, -cy:256 - cy]
            mask = (xx ** 2 / (rx ** 2 + 1e-6) + yy ** 2 / (ry ** 2 + 1e-6)) <= 1
            y[i, :, :, 0] = np.clip(y[i, :, :, 0] + mask.astype(np.float32), 0, 1)

        # Make corresponding image bluer in flooded areas
        X[i, :, :, 2] = np.clip(X[i, :, :, 2] + y[i, :, :, 0] * 0.3, 0, 1)

    return X, y


def train():
    if not HAS_TF:
        print("Cannot train without TensorFlow. Exiting.")
        return

    print("=" * 60)
    print("  U-Net Flood Segmentation — Training Pipeline")
    print("=" * 60)

    # Build model
    model = build_unet()
    model.summary()

    # Generate data
    print("\n📦 Generating sample data...")
    X, y = create_sample_data(200)

    split = int(0.8 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    print(f"   Train: {len(X_train)} | Val: {len(X_val)}")

    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
    ]

    # Train
    print("\n🚀 Training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=20,
        batch_size=8,
        callbacks=callbacks,
        verbose=1,
    )

    # Save
    os.makedirs("saved_models", exist_ok=True)
    model.save("saved_models/cnn_flood_segmentation.h5")
    print("\n✅ Model saved to saved_models/cnn_flood_segmentation.h5")

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"   Val Loss: {val_loss:.4f} | Val Accuracy: {val_acc:.4f}")


if __name__ == "__main__":
    train()
