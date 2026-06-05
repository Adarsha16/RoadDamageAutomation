import os
import random
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset
import albumentations as A

def get_train_transforms(img_size=640):
    """
    Returns an Albumentations pipeline designed to simulate tricky conditions
    like rainy, overcast, and night-time environments, alongside geometric transforms.
    Ensures YOLO bounding boxes are properly adjusted or dropped if they fall outside.
    """
    return A.Compose(
        [
            # Applied geometric transforms
            A.HorizontalFlip(p=0.5),
            # Applied rotation ±15°. border_mode=0 meaning black border
            A.Rotate(limit=15, p=0.5, border_mode=cv2.BORDER_CONSTANT, fill=0),
            
            # Applied weather & lighting transforms
            # We use A.OneOf to apply one of these distinct environmental conditions
            A.OneOf([
                # Rain Simulation
                A.RandomRain(
                    slant_range=(-10, 10), 
                    drop_length=20, drop_width=1, drop_color=(200, 200, 200), 
                    blur_value=3, brightness_coefficient=0.8, p=1.0
                ),
                # Overcast simulation
                A.Compose([
                    A.RandomBrightnessContrast(
                        brightness_limit=(-0.3, -0.1), 
                        contrast_limit=(-0.3, -0.1), p=1.0
                    ),
                    A.Blur(blur_limit=3, p=0.5)
                ], p=1.0),
                # Night time simulation
                A.Compose([
                    A.RandomBrightnessContrast(
                        brightness_limit=(-0.6, -0.4), 
                        contrast_limit=(0.1, 0.3), p=1.0
                    ),
                    A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5), p=0.7),
                    A.RandomGamma(gamma_limit=(50, 80), p=1.0)
                ], p=1.0)
            ], p=0.5),

            # Some noise
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
        ],
        bbox_params=A.BboxParams(
            format='yolo', 
            label_fields=['class_labels'],
            min_visibility=0.2 
        )
    )

class RoadDamageDataset(Dataset):
    """
    PyTorch Dataset handling YOLO format bounding boxes and Mosaic augmentation.
    Mosaic cannot be implemented as a simple single-image transform in Albumentations,
    so it's built into the dataset loading logic.
    """
    def __init__(self, img_dir, label_dir, img_size=640, mosaic_prob=0.5, transforms=None):
        self.img_dir = img_dir
        self.label_dir = label_dir
        self.img_size = img_size
        self.mosaic_prob = mosaic_prob
        self.transforms = transforms
        
        self.img_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
    def __len__(self):
        return len(self.img_files)

    def load_image_and_labels(self, index):
        """Loads a single image and its YOLO labels."""
        img_name = self.img_files[index]
        img_path = os.path.join(self.img_dir, img_name)
        
        img = cv2.imread(img_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        label_name = os.path.splitext(img_name)[0] + '.txt'
        label_path = os.path.join(self.label_dir, label_name)
        
        bboxes = []
        class_labels = []
        if os.path.exists(label_path):
            with open(label_path, 'r') as f:
                for line in f.readlines():
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_id = int(parts[0])
                        # YOLO format: x_center, y_center, width, height (normalized 0-1)
                        x_c, y_c, w, h = map(float, parts[1:5])
                        bboxes.append([x_c, y_c, w, h])
                        class_labels.append(class_id)
                        
        return img, bboxes, class_labels

    def load_mosaic(self, index):
        """
        Loads 4 images and combines them into a single mosaic.
        Updates YOLO bounding boxes to match the new mosaic coordinates.
        """
        labels4 = []
        bboxes4 = []
        s = self.img_size
        xc, yc = int(random.uniform(s * 0.5, s * 1.5)), int(random.uniform(s * 0.5, s * 1.5))  # mosaic center x, y
        
        # 4 indices: 1 current, 3 random
        indices = [index] + [random.randint(0, len(self.img_files) - 1) for _ in range(3)]
        
        img4 = np.full((s * 2, s * 2, 3), 114, dtype=np.uint8)  # base image with gray background
        
        for i, idx in enumerate(indices):
            # Load image
            img, bboxes, class_labels = self.load_image_and_labels(idx)
            h, w, _ = img.shape
            
            # Scale image to img_size to make mosaic calculation easier
            if h != s or w != s:
                img = cv2.resize(img, (s, s))
                h, w = s, s

            # place img in img4
            if i == 0:  # top left
                x1a, y1a, x2a, y2a = max(xc - w, 0), max(yc - h, 0), xc, yc  # xmin, ymin, xmax, ymax (large image)
                x1b, y1b, x2b, y2b = w - (x2a - x1a), h - (y2a - y1a), w, h  # xmin, ymin, xmax, ymax (small image)
            elif i == 1:  # top right
                x1a, y1a, x2a, y2a = xc, max(yc - h, 0), min(xc + w, s * 2), yc
                x1b, y1b, x2b, y2b = 0, h - (y2a - y1a), min(w, x2a - x1a), h
            elif i == 2:  # bottom left
                x1a, y1a, x2a, y2a = max(xc - w, 0), yc, xc, min(s * 2, yc + h)
                x1b, y1b, x2b, y2b = w - (x2a - x1a), 0, w, min(y2a - y1a, h)
            elif i == 3:  # bottom right
                x1a, y1a, x2a, y2a = xc, yc, min(xc + w, s * 2), min(s * 2, yc + h)
                x1b, y1b, x2b, y2b = 0, 0, min(w, x2a - x1a), min(y2a - y1a, h)

            img4[y1a:y2a, x1a:x2a] = img[y1b:y2b, x1b:x2b]
            padw = x1a - x1b
            padh = y1a - y1b

            # Process Labels
            if len(bboxes) > 0:
                for bbox, cls_id in zip(bboxes, class_labels):
                    # Bbox is YOLO format (normalized relative to original image size)
                    # Convert to absolute coordinates of the small resized image
                    b_x_center = bbox[0] * w
                    b_y_center = bbox[1] * h
                    b_width = bbox[2] * w
                    b_height = bbox[3] * h
                    
                    # Apply translation to place within mosaic
                    x_center_mos = b_x_center + padw
                    y_center_mos = b_y_center + padh
                    
                    # Convert back to normalized YOLO format relative to the large mosaic image
                    mos_w = s * 2
                    mos_h = s * 2
                    
                    norm_x = x_center_mos / mos_w
                    norm_y = y_center_mos / mos_h
                    norm_w = b_width / mos_w
                    norm_h = b_height / mos_h
                    
                    bboxes4.append([norm_x, norm_y, norm_w, norm_h])
                    labels4.append(cls_id)
                    
        # Resize mosaic from s*2 x s*2 back down to s x s
        img4 = cv2.resize(img4, (s, s))
        # Bounding boxes are still valid since they are normalized (0-1)!
        
        # Finally, we clip boxes that are out of bounds and drop invalid ones
        valid_bboxes = []
        valid_labels = []
        for bbox, cls_id in zip(bboxes4, labels4):
            x_c, y_c, w_box, h_box = bbox
            x1 = x_c - w_box/2
            y1 = y_c - h_box/2
            x2 = x_c + w_box/2
            y2 = y_c + h_box/2
            
            # Clip
            x1 = np.clip(x1, 0, 1)
            y1 = np.clip(y1, 0, 1)
            x2 = np.clip(x2, 0, 1)
            y2 = np.clip(y2, 0, 1)
            
            w_new = x2 - x1
            h_new = y2 - y1
            
            if w_new > 0.01 and h_new > 0.01:
                new_xc = x1 + w_new/2
                new_yc = y1 + h_new/2
                valid_bboxes.append([new_xc, new_yc, w_new, h_new])
                valid_labels.append(cls_id)
        
        return img4, valid_bboxes, valid_labels

    def __getitem__(self, index):
        # 1. Optionally apply Mosaic
        if random.random() < self.mosaic_prob:
            img, bboxes, class_labels = self.load_mosaic(index)
        else:
            img, bboxes, class_labels = self.load_image_and_labels(index)
            # Resize standard images to match target shape
            img = cv2.resize(img, (self.img_size, self.img_size))
            
        # 2. Apply Albumentations Transforms (Rain, Overcast, Night, Rotate, Flip, etc.)
        if self.transforms:
            transformed = self.transforms(image=img, bboxes=bboxes, class_labels=class_labels)
            img = transformed['image']
            bboxes = transformed['bboxes']
            class_labels = transformed['class_labels']
            
        # Optional: Convert to torch tensors if pushing straight to DataLoader
        # img = torch.from_numpy(img.transpose(2, 0, 1)).float() / 255.0
        
        return img, bboxes, class_labels

# Example usage
if __name__ == "__main__":
    transforms = get_train_transforms()
    print("Albumentations pipeline configured successfully.")
    
    # Initialize dataset
    img_dir = "RDD_SPLIT/train/images"
    label_dir = "RDD_SPLIT/train/labels"
    
    # Check if dataset exists before running
    if os.path.exists(img_dir) and os.path.exists(label_dir):
        dataset = RoadDamageDataset(img_dir=img_dir, label_dir=label_dir, transforms=transforms)
        
        output_dir = "backend/augmented_samples"
        os.makedirs(output_dir, exist_ok=True)
        
        for i in range(4):
            idx = random.randint(0, len(dataset)-1)
            img, bboxes, labels = dataset[idx]
            
            # Dataset returns RGB, convert to BGR for cv2 saving
            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            h, w, _ = img_bgr.shape
            
            # Draw bounding boxes
            for bbox, label in zip(bboxes, labels):
                x_c, y_c, bw, bh = bbox
                xmin = int((x_c - bw / 2) * w)
                ymin = int((y_c - bh / 2) * h)
                xmax = int((x_c + bw / 2) * w)
                ymax = int((y_c + bh / 2) * h)
                cv2.rectangle(img_bgr, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                cv2.putText(img_bgr, f"Class {label}", (xmin, max(ymin - 5, 10)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
            out_path = os.path.join(output_dir, f"sample_{i}.jpg")
            cv2.imwrite(out_path, img_bgr)
            print(f"Saved augmented sample to {out_path}")
    else:
        print(f"Dataset not found at {img_dir}. Please check the path.")
