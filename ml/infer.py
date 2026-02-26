import sys
import json
from PIL import Image
import torch

# Hugging Face Transformers for image classification
from transformers import AutoImageProcessor, AutoModelForImageClassification

# ✅ This model is trained for DR grading on retinal fundus images (APTOS 2019)
MODEL_ID = "rafalosa/diabetic-retinopathy-224-procnorm-vit"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]

    # Load image
    image = Image.open(image_path).convert("RGB")

    # Load processor + model (downloads weights the first time, then uses cache)
    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
    model.eval()

    # Preprocess image → tensors
    inputs = processor(images=image, return_tensors="pt")

    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0]
        probs = torch.softmax(logits, dim=0)

    # Map prediction to label
    pred_idx = int(torch.argmax(probs).item())

    # Many HF image-classification models expose label names here:
    id2label = model.config.id2label if hasattr(model.config, "id2label") else None
    label = id2label.get(pred_idx, str(pred_idx)) if isinstance(id2label, dict) else str(pred_idx)
    labels = [model.config.id2label[i] for i in range(len(model.config.id2label))]
    result = {
        "model": MODEL_ID,
        "class_index": pred_idx,
        "label": label,
        "confidence": float(probs[pred_idx].item()),
        "probabilities": [float(p.item()) for p in probs],
        "labels": labels
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()