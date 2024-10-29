from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch

MODEL_DIR = "server\model\sdxl-detector"
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

    # Get the predicted class and its confidence
    predicted_class = torch.argmax(probabilities).item()
    confidence = probabilities[predicted_class].item()

    # Convert probabilities to a dictionary for each class
    class_confidences = {i: prob.item() for i, prob in enumerate(probabilities)}
    return predicted_class, confidence, class_confidences


# predicted_class, confidence, class_confidences = predict('server\model\\test.jpg')
# print(f"Predicted class: {predicted_class} with confidence: {confidence}")
# print("Confidence for each class:", class_confidences)