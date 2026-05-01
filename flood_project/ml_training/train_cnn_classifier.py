"""
Training script for CNN Flood Classifier.
Input: 224×224×3 satellite images, labeled flooded/not-flooded.
"""

import os
import numpy as np

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("⚠️  TensorFlow not installed. Install with: pip install tensorflow")

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from models.cnn_flood_classifier import build_cnn_classifier


def create_sample_data(n_samples=200):
    """Generate synthetic training data for demonstration."""
    X = np.random.rand(n_samples, 224, 224, 3).astype(np.float32)
    y = np.random.randint(0, 2, n_samples).astype(np.float32)

    # Make patterns: flooded images tend to have more blue
    for i in range(n_samples):
        if y[i] == 1:
            X[i, :, :, 2] *= 1.5  # Boost blue channel
            X[i] = np.clip(X[i], 0, 1)

    return X, y


def train():
    if not HAS_TF:
        print("Cannot train without TensorFlow. Exiting.")
        return

    print("=" * 60)
    print("  CNN Flood Classifier — Training Pipeline")
    print("=" * 60)

    # Build model
    model = build_cnn_classifier()
    model.summary()

    # Generate or load data
    print("\n📦 Generating sample data...")
    X, y = create_sample_data(500)

    # Train/val split
    split = int(0.8 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    print(f"   Train: {len(X_train)} | Val: {len(X_val)}")

    # Data augmentation
    datagen = ImageDataGenerator(
        rotation_range=20,
        horizontal_flip=True,
        vertical_flip=True,
        zoom_range=0.15,
        fill_mode='reflect',
    )

    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
    ]

    # Train
    print("\n🚀 Training...")
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=32),
        validation_data=(X_val, y_val),
        epochs=20,
        callbacks=callbacks,
        verbose=1,
    )

    # Save
    os.makedirs("saved_models", exist_ok=True)
    model.save("saved_models/cnn_flood_classifier.h5")
    print("\n✅ Model saved to saved_models/cnn_flood_classifier.h5")

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"   Val Loss: {val_loss:.4f} | Val Accuracy: {val_acc:.4f}")


if __name__ == "__main__":
    train()
