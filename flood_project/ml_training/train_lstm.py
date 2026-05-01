"""
Training script for LSTM Flood Forecaster.
Input: (timesteps=48, features=5) — [rainfall, river_level, soil_moisture, temperature, humidity]
Output: predicted_water_level
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
from models.lstm_water_prediction import build_lstm_model


def create_sample_data(n_samples=500, timesteps=48, features=5):
    """
    Generate synthetic time-series data.
    Features: rainfall, river_level, soil_moisture, temperature, humidity
    Target: next water level
    """
    X = np.zeros((n_samples, timesteps, features), dtype=np.float32)
    y = np.zeros(n_samples, dtype=np.float32)

    for i in range(n_samples):
        t = np.arange(timesteps)

        # Rainfall: periodic + noise
        rainfall = 10 + 15 * np.sin(t / 12 * np.pi) + np.random.normal(0, 3, timesteps)
        rainfall = np.clip(rainfall, 0, 50)

        # River level: correlated with rainfall (lagged)
        base_level = 2.0 + np.cumsum(rainfall * 0.01) * 0.1
        river_level = base_level + np.random.normal(0, 0.1, timesteps)

        # Soil moisture
        soil = 0.4 + 0.3 * np.sin(t / 24 * np.pi) + np.random.normal(0, 0.05, timesteps)
        soil = np.clip(soil, 0, 1)

        # Temperature
        temp = 25 + 5 * np.sin(t / 24 * np.pi) + np.random.normal(0, 1, timesteps)

        # Humidity
        humidity = 60 + 20 * np.sin(t / 12 * np.pi) + np.random.normal(0, 5, timesteps)
        humidity = np.clip(humidity, 20, 100)

        X[i] = np.column_stack([rainfall, river_level, soil, temp, humidity])

        # Target: next water level (correlated with recent rainfall + river level)
        y[i] = river_level[-1] + np.mean(rainfall[-6:]) * 0.05 + np.random.normal(0, 0.1)

    # Normalize
    for f in range(features):
        mean = X[:, :, f].mean()
        std = X[:, :, f].std() + 1e-8
        X[:, :, f] = (X[:, :, f] - mean) / std

    return X, y


def train():
    if not HAS_TF:
        print("Cannot train without TensorFlow. Exiting.")
        return

    print("=" * 60)
    print("  LSTM Flood Forecaster — Training Pipeline")
    print("=" * 60)

    # Build model
    model = build_lstm_model()
    model.summary()

    # Generate data
    print("\n📦 Generating sample time-series data...")
    X, y = create_sample_data(1000)

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
        epochs=30,
        batch_size=32,
        callbacks=callbacks,
        verbose=1,
    )

    # Save
    os.makedirs("saved_models", exist_ok=True)
    model.save("saved_models/lstm_flood_forecaster.h5")
    print("\n✅ Model saved to saved_models/lstm_flood_forecaster.h5")

    # Evaluate
    val_loss, val_mae = model.evaluate(X_val, y_val, verbose=0)
    print(f"   Val MSE: {val_loss:.4f} | Val MAE: {val_mae:.4f}")


if __name__ == "__main__":
    train()
