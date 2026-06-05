from ultralytics import YOLO

model = YOLO('weights/best.pt')


results = model('path_to_sample_image.jpg')

for r in results:
    for box in r.boxes:
        print("class_id:", int(box.cls))
        print("class_name:", model.names[int(box.cls)])
        print("confidence:", float(box.conf))
        print("bbox (x1,y1,x2,y2):", box.xyxy[0].tolist())
        print("---")