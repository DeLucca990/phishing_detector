import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

DEVICE = 0 if torch.cuda.is_available() else -1
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_NAME = "ealvaradob/bert-finetuned-phishing"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.to(device)

ID2LABEL = model.config.id2label

classifier = pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    device=DEVICE,
    return_all_scores=True,
)

MAX_LEN = model.config.max_position_embeddings

def ml_predict(url: str):
    raw_out = classifier(
        url,
        truncation=True,
        max_length=MAX_LEN
    )[0]

    scores = []
    for item in raw_out:
        raw_label = item["label"]
        idx = None

        if raw_label.startswith("LABEL_"):
            idx = int(raw_label.split("_")[1])
            label = ID2LABEL.get(idx, raw_label)
        else:
            label = raw_label

        scores.append((label, float(item["score"])))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores
