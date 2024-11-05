from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import json
import os

MODEL_DIR = os.path.join("server", "model", "sdxl-detector")
processor = AutoImageProcessor.from_pretrained(MODEL_DIR)
model = AutoModelForImageClassification.from_pretrained(MODEL_DIR)


def predict(image_path):
    # Load and preprocess the image
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)

    # Apply softmax to get probabilities
    logits = outputs.logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1).squeeze()

    # Get the predicted class and confidence
    predicted_class = torch.argmax(probabilities).item()
    confidence = probabilities[predicted_class].item()
    predicted_class = "AI-Generated Image" if predicted_class == 0 else "Real Image"

    # Convert probabilities to a dictionary for each class
    class_confidences = {i: prob.item() for i, prob in enumerate(probabilities)}

    output = {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "class_confidences": class_confidences
    }

    print(json.dumps(output))


if __name__ == "__main__":
    import sys
    predict(sys.argv[1])