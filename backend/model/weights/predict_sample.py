# road-damage-detection/model/predict_sample.py
from ultralytics import YOLO

# 1. Load the local best.pt weights
model = YOLO('weights/best.pt')

# 2. Run inference on a public sample image url so it runs immediately for anyone
sample_img = 'https://ultralytics.com/images/bus.jpg'
results = model(sample_img)

# 3. Print the exact structure Adarsha needs to parse
for r in results:
    for box in r.boxes:
        print("class_id:", int(box.cls))
        print("class_name:", model.names[int(box.cls)])
        print("confidence:", float(box.conf))
        print("bbox (x1,y1,x2,y2):", box.xyxy[0].tolist())
        print("---")

print("predict_sample.py initialized. Load weights/best.pt to run inference.")