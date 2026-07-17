

**Automated road damage detection and intelligent repair planning powered by YOLOv8 and A\* search.**

This is a full-stack application that detects road surface defects from images, computes a composite Severity Index, visualises damage along surveyed routes, and generates optimal repair plans using AI search — all through an interactive web interface.

> Built to address Nepal's road maintenance challenges, where 28,000+ km of road network face accelerated deterioration each monsoon season with less than 5% inspected annually.

---

## ✨ Features

| Module | Description |
|---|---|
| **Detection** | Upload a road image to identify and localise four damage types with bounding boxes and confidence scores |
| **Severity Analysis** | Compute a weighted Severity Index (SI) that grades road condition as Good / Fair / Poor / Critical |
| **Route Mapping** | Interactive Folium heatmap with severity-graded road segments along surveyed corridors |
| **AI Repair Planner** | A\* search agent that produces an optimal, cost-minimised repair sequence with time estimates |

### Damage Classes

| Code | Class | SI Weight | Description |
|------|-------|-----------|-------------|
| D00 | Longitudinal Crack | 0.5 | Cracks running along the road direction |
| D10 | Transverse Crack | 0.3 | Cracks perpendicular to travel direction |
| D20 | Alligator Crack | 0.8 | Interconnected crack patterns resembling scales |
| D40 | Pothole | 1.0 | Bowl-shaped depressions in the road surface |

---

## 🏗️ Architecture

```
RoadDamageAutomation/
├── backend/
│   ├── api.py                    # FastAPI server with /detect, /severity, /repair-plan endpoints
│   ├── repair_planner.py         # A* search-based repair scheduling agent
│   ├── severity_map.py           # Folium route visualisation with OSRM routing
│   ├── audit_and_split.py        # Dataset auditing and stratified train/val/test splitting
│   ├── augmentation_pipeline.py  # Albumentations + mosaic data augmentation
│   ├── requirements.txt          # Python dependencies
│   └── model/
│       ├── rdd2022.yaml          # YOLO dataset configuration
│       ├── train_colab.ipynb     # Training notebook (Google Colab)
│       └── weights/
│           ├── best.pt           # Trained YOLOv8 weights
│           └── predict_sample.py # Quick inference test script
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Detection.jsx     # Detection interface
│   │   │   ├── Severity.jsx      # Severity analysis with contribution charts
│   │   │   └── RepairPlan.jsx    # Repair plan with interactive timeline
│   │   └── components/
│   │       ├── Hero.jsx          # Hero section with project pipeline
│   │       ├── Problem.jsx       # Problem statement section
│   │       ├── Dataset.jsx       # RDD2022 dataset overview
│   │       ├── Approach.jsx      # Methodology breakdown
│   │       ├── ImageUpload.jsx   # Drag-and-drop image upload
│   │       ├── Navbar.jsx        # Navigation bar
│   │       └── Footer.jsx        # Footer
│   └── public/
│       └── severity_map.html     # Generated Folium map
└── severity/
    ├── severity_index.ipynb      # SI formula validation notebook
    ├── damage_breakdown.png      # Class distribution visualisation
    ├── si_distribution.png       # SI distribution across sample frames
    ├── worst_frames.png          # Highest-severity frame analysis
    └── yolov8n.pt                # Base YOLOv8n pretrained weights
```

---

## Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Linux/macOS
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Check health with:

```bash
curl http://localhost:8000/api/health
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies API requests to the backend at port 8000.

---

## API Reference

All endpoints accept multipart file uploads.

### `GET /api/health`

Health check. Returns model status.

```json
{ "status": "ok", "model": "best.pt" }
```

### `POST /api/detect`

Run object detection on an uploaded road image.

**Request:** `multipart/form-data` with field `file` (image)

**Response:**
```json
{
  "image": "<base64 JPEG with bounding boxes>",
  "detections": [
    {
      "class_id": 3,
      "class_name": "Pothole",
      "confidence": 0.8721,
      "bbox": [120.5, 200.3, 340.1, 380.7],
      "bbox_area": 39608.9,
      "relative_area": 0.042,
      "weight": 1.0,
      "contribution": 0.03663
    }
  ],
  "class_counts": { "Longitudinal Crack": 0, "Transverse Crack": 1, "Alligator Crack": 0, "Pothole": 2 },
  "total_detections": 3,
  "frame_area": 921600,
  "image_width": 1280,
  "image_height": 720
}
```

### `POST /api/severity`

Detection + Severity Index computation.

Returns the same fields as `/api/detect` plus:
```json
{
  "severity_index": 0.04521,
  "grade": "Poor"
}
```

### `POST /api/repair-plan`

Detection + severity + A\* repair planning.

Returns detection and severity fields plus:
```json
{
  "repair_plan": {
    "steps": [
      {
        "rank": 1,
        "segment_id": 0,
        "damage_type": "Pothole",
        "action": "Patch & Fill",
        "description": "Excavate and fill with hot-mix asphalt",
        "severity": 0.5234,
        "confidence": 0.8721,
        "relative_area": 0.042,
        "cost": 12.45,
        "estimated_hours": 1.05,
        "cumulative_cost": 12.45,
        "priority_score": 1.567
      }
    ],
    "total_cost": 18.72,
    "total_hours": 2.35,
    "nodes_expanded": 15,
    "search_time_ms": 0.42,
    "segments_count": 3
  }
}
```

---

##  How It Works

### Severity Index

Each detection contributes to the overall Severity Index:

```
SI = Σ (Wᵢ × Confᵢ × Aᵢ/Aframe)
```

Where:
- **Wᵢ** — Class weight reflecting real-world repair urgency (Pothole = 1.0, Alligator = 0.8, Longitudinal = 0.5, Transverse = 0.3)
- **Confᵢ** — Model confidence score
- **Aᵢ/Aframe** — Bounding box area relative to total frame area

| Grade | SI Range | Meaning |
|-------|----------|---------|
| Good | SI < 0.005 | Minimal or no visible damage |
| Fair | 0.005 – 0.02 | Minor cracks, low urgency |
| Poor | 0.02 – 0.05 | Noticeable damage, needs maintenance |
| Critical | SI ≥ 0.05 | Severe damage, immediate action required |

### A\* Repair Planner

The repair planner formulates maintenance scheduling as a state-space search problem:

- **State:** Set of repaired road segments
- **Actions:** Repair operations (Patch & Fill, Crack Sealing, Surface Overlay)
- **Cost function `g(n)`:** `base_cost × (1 + severity) × area_factor × traffic_importance`
- **Heuristic `h(n)`:** Sum of minimum repair costs for all unrepaired segments (admissible — never overestimates)

Since `h(n)` is admissible, A\* guarantees finding the optimal repair sequence. The planner runs in under 5 ms for typical damage counts.

---

## 📊 Dataset

The model is trained on the **RDD2022** (Road Damage Dataset 2022), released as part of the Crowdsensing-based Road Damage Detection Challenge (CRDDC'22).

| Metric | Value |
|--------|-------|
| Total Images | 47,420 |
| Total Annotations | 55,000+ |
| Countries | 6 (Japan, India, Czech Republic, Norway, USA, China) |
| Damage Classes | 4 |
| Train/Val/Test Split | 80/10/10 (stratified) |

### Data Augmentation

The training pipeline uses Albumentations with:
- Horizontal flips and rotation (±15°)
- Mosaic tiling (4-image composites)
- Simulated weather conditions (rain, overcast, nighttime)
- Random brightness/contrast adjustments
- ISO noise injection for low-light simulation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Object Detection** | YOLOv8 (Ultralytics) |
| **Backend** | FastAPI, Uvicorn |
| **Image Processing** | OpenCV, NumPy |
| **Data Augmentation** | Albumentations, PyTorch |
| **Route Mapping** | Folium, OSRM |
| **Frontend** | React 19, React Router |
| **Styling** | Tailwind CSS 4 |
| **Build Tool** | Vite 8 |
| **Training** | Google Colab (GPU) |

---

## 🗺️ Route Severity Map

The severity map plots damage severity along surveyed road segments using Folium and OSRM routing. The current prototype covers the **Suryabinayak – Dhulikhel corridor** with six waypoints, each colour-coded by severity:

- **Green** — Low severity (< 0.3)
- **Orange** — Moderate severity (0.3 – 0.7)
- **Red** — High severity (> 0.7)

To regenerate the map:
```bash
cd backend
python severity_map.py
```

---

## Data Pipeline Scripts

### Dataset Audit

Validate dataset integrity, check for missing/orphan labels, and profile class distributions:

```bash
cd backend
python audit_and_split.py --root /path/to/RDD2022
```

### Stratified Re-split

Create a balanced 80/10/10 train/val/test split with class stratification:

```bash
python audit_and_split.py --root /path/to/RDD2022 --split --seed 42
```

### Augmentation Preview

Generate augmented samples with bounding box visualisation:

```bash
python augmentation_pipeline.py
```

---

## Acknowledgements

- [RDD2022 Dataset](https://github.com/sekilab/RoadDamageDetector) — Crowdsensing-based Road Damage Detection Challenge
- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) — Object detection framework
- [OSRM](https://project-osrm.org/) — Open Source Routing Machine for road network routing
- [Albumentations](https://albumentations.ai/) — Image augmentation library
