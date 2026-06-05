
import os
import sys
import shutil
import random
import argparse
from pathlib import Path
from collections import defaultdict, Counter

# Configuration 

DATASET_ROOT = Path(__file__).resolve().parent.parent / "RDD_SPLIT"
OUTPUT_ROOT  = Path(__file__).resolve().parent.parent / "RDD_SPLIT_NEW"   

IMAGE_EXTS   = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
CLASS_NAMES  = {
    0: "D00 - Longitudinal Crack",
    1: "D10 - Transverse Crack",
    2: "D20 - Alligator Crack",
    3: "D40 - Pothole",
}
SPLITS       = ["train", "val", "test"]
SPLIT_RATIOS = (0.80, 0.10, 0.10)        

_label_cache = {}

# Helpers 

def find_image(label_path: Path, images_dir: Path):
    stem = label_path.stem
    for ext in IMAGE_EXTS:
        candidate = images_dir / f"{stem}{ext}"
        if candidate.exists():
            return candidate
    return None


def parse_yolo_label(label_path: Path):
    key = str(label_path)
    if key in _label_cache:
        return _label_cache[key]

    class_ids = []
    issues = []
    try:
        text = label_path.read_text(encoding="utf-8").strip()
    except Exception as e:
        issues.append(f"Read error: {e}")
        _label_cache[key] = (class_ids, issues)
        return class_ids, issues

    if not text:
        _label_cache[key] = (class_ids, [])
        return class_ids, []           

    for line_no, line in enumerate(text.splitlines(), 1):
        parts = line.strip().split()
        if len(parts) < 5:
            issues.append(f"  Line {line_no}: expected >=5 fields, got {len(parts)}")
            continue
        try:
            cls_id = int(parts[0])
        except ValueError:
            issues.append(f"  Line {line_no}: non-integer class id '{parts[0]}'")
            continue
        if cls_id not in CLASS_NAMES:
            issues.append(f"  Line {line_no}: unknown class id {cls_id}")
        # Validate bbox floats
        try:
            coords = [float(v) for v in parts[1:5]]
            for v in coords:
                if not (0.0 <= v <= 1.0):
                    issues.append(f"  Line {line_no}: bbox value {v} out of [0,1]")
        except ValueError:
            issues.append(f"  Line {line_no}: non-float bbox values")
            continue
        class_ids.append(cls_id)
    _label_cache[key] = (class_ids, issues)
    return class_ids, issues



def audit(dataset_root: Path):

    print("=" * 70)
    print("  RDD2022 DATASET AUDIT REPORT")
    print("=" * 70)

    all_pairs = []                         
    global_class_counts   = Counter()       
    global_image_classes  = Counter()       
    total_annotations     = 0
    missing_labels        = []
    empty_labels          = []
    orphan_labels         = []
    format_issues         = {}              
    images_without_annot  = []              

    for split in SPLITS:
        print(f"\nStarting split: {split.upper()}...", flush=True)
        split_dir   = dataset_root / split
        images_dir  = split_dir / "images"
        labels_dir  = split_dir / "labels"

        if not images_dir.exists():
            print(f"\n[!] {split}/images not found - skipping.", flush=True)
            continue

        print(f"  Scanning images and labels for {split}...", flush=True)
        image_files = sorted(
            p for p in images_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS
        )
        label_files = {p.stem: p for p in labels_dir.iterdir() if p.suffix == ".txt"} if labels_dir.exists() else {}

        split_class_counts  = Counter()
        split_annotations   = 0
        split_missing       = 0
        split_empty         = 0
        split_issues        = 0

        n_images = len(image_files)
        for idx, img_path in enumerate(image_files):
            if (idx + 1) % 5000 == 0 or idx == n_images - 1:
                print(f"    Processing {idx+1}/{n_images}...", flush=True)
            stem = img_path.stem
            lbl_path = label_files.pop(stem, None)

            if lbl_path is None:
                # Try to find by constructing expected path
                expected = labels_dir / f"{stem}.txt"
                if expected.exists():
                    lbl_path = expected
                else:
                    missing_labels.append(img_path)
                    split_missing += 1
                    all_pairs.append((img_path, None))
                    continue

            class_ids, issues = parse_yolo_label(lbl_path)

            if issues:
                format_issues[str(lbl_path)] = issues
                split_issues += len(issues)

            if not class_ids:
                empty_labels.append(img_path)
                images_without_annot.append(img_path)
                split_empty += 1

            for cid in class_ids:
                split_class_counts[cid] += 1
                global_class_counts[cid] += 1
            global_image_classes.update(set(class_ids))
            split_annotations += len(class_ids)
            total_annotations += len(class_ids)

            all_pairs.append((img_path, lbl_path))

        # Orphan labels (label exists but no image)
        for stem, lbl in label_files.items():
            orphan_labels.append(lbl)

        #  Summary 
        print(f"\n{'-' * 70}", flush=True)
        print(f"  Split: {split.upper()}", flush=True)
        print(f"{'-' * 70}", flush=True)
        print(f"  Images          : {len(image_files):>8,}", flush=True)
        print(f"  Annotations     : {split_annotations:>8,}", flush=True)
        print(f"  Missing labels  : {split_missing:>8}", flush=True)
        print(f"  Empty labels    : {split_empty:>8}", flush=True)
        print(f"  Orphan labels   : {len(label_files):>8}", flush=True)
        print(f"  Format issues   : {split_issues:>8}\n", flush=True)
        print(f"  {'Class':<35s} {'Annotations':>12s}  {'Images':>8s}", flush=True)
        print(f"  {'-'*35} {'-'*12} {'-'*8}", flush=True)
        for cid in sorted(CLASS_NAMES.keys()):
            print(f"  {CLASS_NAMES[cid]:<35s} {split_class_counts.get(cid, 0):>12,}", flush=True)

    # Global summary 
    print(f"\n{'=' * 70}")
    print("  GLOBAL SUMMARY")
    print(f"{'=' * 70}")
    print(f"  Total images          : {len(all_pairs):>8,}")
    print(f"  Total annotations     : {total_annotations:>8,}")
    print(f"  Missing label files   : {len(missing_labels):>8}")
    print(f"  Empty label files     : {len(empty_labels):>8}")
    print(f"  Orphan label files    : {len(orphan_labels):>8}")
    print(f"  Files with issues     : {len(format_issues):>8}")
    print()
    print(f"  {'Class':<35s} {'Annotations':>12s}  {'Images w/ class':>16s}")
    print(f"  {'-'*35} {'-'*12} {'-'*16}")
    for cid in sorted(CLASS_NAMES.keys()):
        print(f"  {CLASS_NAMES[cid]:<35s} {global_class_counts.get(cid, 0):>12,}  {global_image_classes.get(cid, 0):>16,}")

    if format_issues:
        print(f"\n{'-' * 70}")
        print("  FORMAT ISSUES (showing first 20)")
        print(f"{'-' * 70}")
        for i, (path, issues) in enumerate(format_issues.items()):
            if i >= 20:
                print(f"  ... and {len(format_issues) - 20} more files with issues.")
                break
            print(f"  {path}")
            for issue in issues:
                print(f"    {issue}")

    if missing_labels:
        print(f"\n  [!] {len(missing_labels)} image(s) have no label file.")
        for p in missing_labels[:10]:
            print(f"     {p.name}")
        if len(missing_labels) > 10:
            print(f"     ... and {len(missing_labels) - 10} more.")

    if orphan_labels:
        print(f"\n  [!] {len(orphan_labels)} label(s) have no matching image.")
        for p in orphan_labels[:10]:
            print(f"     {p.name}")
        if len(orphan_labels) > 10:
            print(f"     ... and {len(orphan_labels) - 10} more.")

    print()
    return all_pairs, global_class_counts, images_without_annot




def dominant_class(label_path: Path | None) -> int:

    if label_path is None or not label_path.exists():
        return -1
    class_ids, _ = parse_yolo_label(label_path)
    if not class_ids:
        return -1
    return min(set(class_ids))  # simplest: lowest class id present


def stratified_split(pairs, seed=42):
    """
    Split (image, label) pairs into train/val/test maintaining class balance.
    Uses the dominant class of each image as the stratification key.
    """
    random.seed(seed)

    # Group by dominant class
    print("  Grouping images by dominant class...", flush=True)
    buckets = defaultdict(list)
    for img, lbl in pairs:
        dc = dominant_class(lbl)
        buckets[dc].append((img, lbl))

    train, val, test = [], [], []

    for cls_key in sorted(buckets.keys()):
        items = buckets[cls_key]
        random.shuffle(items)
        n = len(items)
        n_train = int(n * SPLIT_RATIOS[0])
        n_val   = int(n * SPLIT_RATIOS[1])
        # rest goes to test
        train.extend(items[:n_train])
        val.extend(items[n_train:n_train + n_val])
        test.extend(items[n_train + n_val:])

    # Shuffle within each split so files aren't grouped by class
    random.shuffle(train)
    random.shuffle(val)
    random.shuffle(test)

    return {"train": train, "val": val, "test": test}


def copy_split(split_dict, output_root: Path):
    """Copy files into the new split directory structure."""
    if output_root.exists():
        print(f"  [!] Output directory already exists: {output_root}")
        resp = input("     Overwrite? [y/N]: ").strip().lower()
        if resp != "y":
            print("  Aborting split.")
            return
        shutil.rmtree(output_root)

    for split_name, pairs in split_dict.items():
        img_dir = output_root / split_name / "images"
        lbl_dir = output_root / split_name / "labels"
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        n_pairs = len(pairs)
        for idx, (img_path, lbl_path) in enumerate(pairs):
            if (idx + 1) % 5000 == 0 or idx == n_pairs - 1:
                print(f"    [{split_name}] Copying {idx+1}/{n_pairs}...", flush=True)
            shutil.copy2(img_path, img_dir / img_path.name)
            if lbl_path and lbl_path.exists():
                shutil.copy2(lbl_path, lbl_dir / lbl_path.name)
            else:
                # Create an empty label so YOLO training doesn't complain
                (lbl_dir / f"{img_path.stem}.txt").touch()

    print(f"\n  [OK] New split written to: {output_root}")


def print_split_stats(split_dict):
    """Show class distribution for the new splits."""
    print(f"\n{'=' * 70}")
    print("  NEW SPLIT DISTRIBUTION")
    print(f"{'=' * 70}")

    header = f"  {'Class':<35s}"
    for s in SPLITS:
        header += f" {s:>8s}"
    header += f" {'total':>8s}"
    print(header)
    print(f"  {'-'*35}" + f" {'-'*8}" * (len(SPLITS) + 1))

    totals_per_split = {s: 0 for s in SPLITS}
    class_counts = {s: Counter() for s in SPLITS}

    for split_name, pairs in split_dict.items():
        for img_path, lbl_path in pairs:
            if lbl_path and lbl_path.exists():
                cids, _ = parse_yolo_label(lbl_path)
                for cid in cids:
                    class_counts[split_name][cid] += 1

    for cid in sorted(CLASS_NAMES.keys()):
        row = f"  {CLASS_NAMES[cid]:<35s}"
        row_total = 0
        for s in SPLITS:
            cnt = class_counts[s].get(cid, 0)
            row += f" {cnt:>8,}"
            row_total += cnt
            totals_per_split[s] += cnt
        row += f" {row_total:>8,}"
        print(row)

    # Background images (class -1)
    row = f"  {'(background / empty)':<35s}"
    row_total = 0
    for s in SPLITS:
        bg = sum(1 for _, lbl in split_dict[s]
                 if lbl is None or not lbl.exists()
                 or lbl.read_text(encoding="utf-8").strip() == "")
        row += f" {bg:>8,}"
        row_total += bg
    row += f" {row_total:>8,}"
    print(row)

    print()
    row = f"  {'TOTAL IMAGES':<35s}"
    for s in SPLITS:
        row += f" {len(split_dict[s]):>8,}"
    row += f" {sum(len(v) for v in split_dict.values()):>8,}"
    print(row)

    # Show percentages
    total_imgs = sum(len(v) for v in split_dict.values())
    row = f"  {'SPLIT %':<35s}"
    for s in SPLITS:
        pct = len(split_dict[s]) / total_imgs * 100 if total_imgs else 0
        row += f" {pct:>7.1f}%"
    print(row)
    print()


# --- Main --------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Audit RDD2022 dataset and optionally re-split."
    )
    parser.add_argument(
        "--split", action="store_true",
        help="After auditing, perform a stratified 80/10/10 re-split."
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed for reproducible splits (default: 42)."
    )
    parser.add_argument(
        "--root", type=str, default=str(DATASET_ROOT),
        help=f"Dataset root (default: {DATASET_ROOT})."
    )
    parser.add_argument(
        "--output", type=str, default=str(OUTPUT_ROOT),
        help=f"Output root for new split (default: {OUTPUT_ROOT})."
    )
    args = parser.parse_args()

    dataset_root = Path(args.root)
    output_root  = Path(args.output)

    if not dataset_root.exists():
        print(f"Error: dataset root not found: {dataset_root}")
        sys.exit(1)

    # Phase 1 — Audit
    all_pairs, class_counts, bg_images = audit(dataset_root)

    if not all_pairs:
        print("No images found. Check dataset path.")
        sys.exit(1)

    # Phase 2 — Split
    if args.split:
        print(f"\n{'=' * 70}")
        print(f"  STRATIFIED SPLIT  (seed={args.seed}, ratio={SPLIT_RATIOS})")
        print(f"{'=' * 70}")

        split_dict = stratified_split(all_pairs, seed=args.seed)
        print_split_stats(split_dict)

        copy_split(split_dict, output_root)

        print("  Done! You can now update your data.yaml to point to the new split.")
    else:
        print("  Tip: run with --split to create a balanced 80/10/10 split.\n")


if __name__ == "__main__":
    main()
