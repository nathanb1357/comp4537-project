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

    # Get the predictions
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=-1).item()  # Get the class with the highest score
    return predicted_class


# result = predict('server\model\\test.jpg')
# print(result)