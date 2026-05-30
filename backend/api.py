"""
FastAPI backend for SHP — Road Damage Detection & Severity Index.
Serves YOLOv8 inference and severity calculation via REST endpoints.
"""

import io
import base64
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# ── Constants ────────────────────────────────────────────────────────────────

CLASS_NAMES = {0: "Longitudinal Crack", 1: "Transverse Crack", 2: "Alligator Crack", 3: "Pothole"}
CLASS_WEIGHTS = {0: 0.5, 1: 0.3, 2: 0.8, 3: 1.0}
BBOX_COLORS = {
    0: (52, 152, 219),   # blue
    1: (46, 204, 191),   # teal
    2: (230, 126, 34),   # orange
    3: (231, 76, 60),    # red
}

GRADE_THRESHOLDS = [
    (0.005, "Good"),
    (0.02,  "Fair"),
    (0.05,  "Poor"),
    (float("inf"), "Critical"),
]

WEIGHTS_PATH = Path(__file__).parent / "model" / "weights" / "best.pt"

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="SHP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
model = YOLO(str(WEIGHTS_PATH))


# ── Helpers ──────────────────────────────────────────────────────────────────

def grade_severity(si: float) -> str:
    for threshold, label in GRADE_THRESHOLDS:
        if si < threshold:
            return label
    return "Critical"


def _read_image(file_bytes: bytes) -> np.ndarray:
    """Decode uploaded bytes into a BGR OpenCV image."""
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def _annotate_image(img: np.ndarray, detections: list) -> np.ndarray:
    """Draw bounding boxes and labels on the image."""
    annotated = img.copy()
    for d in detections:
        x1, y1, x2, y2 = [int(v) for v in d["bbox"]]
        cid = d["class_id"]
        color = BBOX_COLORS.get(cid, (255, 255, 255))
        # BGR for OpenCV
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label = f'{d["class_name"]} {d["confidence"]:.0%}'
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(annotated, label, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    return annotated


def _image_to_base64(img: np.ndarray) -> str:
    """Encode BGR image to base64 JPEG string."""
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def _run_inference(img: np.ndarray):
    """Run YOLO inference and return detections list + results object."""
    h, w = img.shape[:2]
    frame_area = w * h
    results = model(img, verbose=False)

    detections = []
    for r in results:
        if r.boxes is None or len(r.boxes) == 0:
            continue
        for box in r.boxes:
            cid = int(box.cls)
            conf = float(box.conf)
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bbox_area = (x2 - x1) * (y2 - y1)
            relative_area = bbox_area / frame_area
            weight = CLASS_WEIGHTS.get(cid, 0.1)
            contribution = weight * conf * relative_area

            detections.append({
                "class_id": cid,
                "class_name": CLASS_NAMES.get(cid, f"Unknown({cid})"),
                "confidence": round(conf, 4),
                "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "bbox_area": round(bbox_area, 1),
                "relative_area": round(relative_area, 6),
                "weight": weight,
                "contribution": round(contribution, 6),
            })

    severity_index = sum(d["contribution"] for d in detections)
    grade = grade_severity(severity_index)

    # Per-class counts
    class_counts = {}
    for name in CLASS_NAMES.values():
        class_counts[name] = 0
    for d in detections:
        class_counts[d["class_name"]] += 1

    return detections, severity_index, grade, class_counts, frame_area


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": str(WEIGHTS_PATH.name)}


@app.post("/api/detect")
async def detect(file: UploadFile = File(...)):
    """Run detection on an uploaded image. Returns annotated image + detections."""
    contents = await file.read()
    img = _read_image(contents)

    detections, si, grade, class_counts, frame_area = _run_inference(img)
    annotated = _annotate_image(img, detections)

    return {
        "image": _image_to_base64(annotated),
        "detections": detections,
        "class_counts": class_counts,
        "total_detections": len(detections),
        "frame_area": frame_area,
        "image_width": img.shape[1],
        "image_height": img.shape[0],
    }


@app.post("/api/severity")
async def severity(file: UploadFile = File(...)):
    """Run detection + severity index calculation on an uploaded image."""
    contents = await file.read()
    img = _read_image(contents)

    detections, si, grade, class_counts, frame_area = _run_inference(img)
    annotated = _annotate_image(img, detections)

    return {
        "image": _image_to_base64(annotated),
        "detections": detections,
        "class_counts": class_counts,
        "total_detections": len(detections),
        "severity_index": round(si, 5),
        "grade": grade,
        "frame_area": frame_area,
        "image_width": img.shape[1],
        "image_height": img.shape[0],
    }
