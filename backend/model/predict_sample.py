# road-damage-detection/model/predict_sample.py
from ultralytics import YOLO

# Load the local best.pt weights
model = YOLO('weights/best.pt')

# Replace this with the path to any local test image you have
results = model('path_to_sample_image.jpg')

for r in results:
    for box in r.boxes:
        print("class_id:", int(box.cls))
        print("class_name:", model.names[int(box.cls)])
        print("confidence:", float(box.conf))
        print("bbox (x1,y1,x2,y2):", box.xyxy[0].tolist())
        print("---")