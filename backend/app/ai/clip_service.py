import threading
CLIP_MODEL_NAME = "MobileCLIP2-S0"
CLIP_PRETRAINED  = "dfndr2b"
device = "cpu"

_clip_model = None
_clip_tokenizer = None
_clip_lock = threading.Lock()

def get_clip_model():
    """Return (model, tokenizer), loading lazily on first call."""
    global _clip_model, _clip_tokenizer
    if _clip_model is None:
        with _clip_lock:
            if _clip_model is None:
                import torch
                import open_clip
                print(f"Lazy loading {CLIP_MODEL_NAME} ({CLIP_PRETRAINED})...")
                _clip_model, _, _ = open_clip.create_model_and_transforms(
                    CLIP_MODEL_NAME, pretrained=CLIP_PRETRAINED, device=device
                )
                _clip_model.eval()
                _clip_tokenizer = open_clip.get_tokenizer(CLIP_MODEL_NAME)
                print("OpenCLIP model loaded.")
    return _clip_model, _clip_tokenizer

def generate_embedding(text_query: str) -> list[float]:
    import torch
    model, tokenizer = get_clip_model()
    with torch.inference_mode():
        tokens = tokenizer([text_query]).to(device)
        features = model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy()[0].tolist()
