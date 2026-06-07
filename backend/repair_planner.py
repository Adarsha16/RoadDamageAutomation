
from __future__ import annotations

import heapq
import time
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional


#Domain constants 


REPAIR_CATALOGUE: Dict[str, Tuple[str, float, str, float]] = {
    "Pothole":            ("Patch & Fill",       1.00, "Excavate and fill with hot-mix asphalt",            1.5),
    "Longitudinal Crack": ("Crack Sealing",      0.55, "Clean and seal with rubberised bitumen",            0.8),
    "Transverse Crack":   ("Crack Sealing",      0.50, "Route and seal perpendicular crack",                0.7),
    "Alligator Crack":    ("Surface Overlay",    0.85, "Mill and apply thin asphalt overlay",               2.0),
}


DEFAULT_REPAIR = ("General Patch", 0.70, "Standard patching repair", 1.0)


TRAFFIC_WEIGHT_BY_GRADE: Dict[str, float] = {
    "Critical": 1.6,
    "Poor":     1.3,
    "Fair":     1.0,
    "Good":     0.7,
}

# Severity thresholds 
_GRADE_THRESHOLDS = [
    (0.005, "Good"),
    (0.02,  "Fair"),
    (0.05,  "Poor"),
    (float("inf"), "Critical"),
]


def _grade(si: float) -> str:
    for threshold, label in _GRADE_THRESHOLDS:
        if si < threshold:
            return label
    return "Critical"


#Data classes 

@dataclass(frozen=True)
class RoadSegment:
    """A single damaged road segment produced by the perception layer."""
    id: int
    damage_type: str          
    severity: float           
    confidence: float         
    relative_area: float      
    bbox: Tuple[float, ...]  
    traffic_importance: float = 1.0  


@dataclass
class RepairAction:
    segment_id: int
    segment_damage_type: str
    action_name: str
    description: str
    cost: float              
    estimated_hours: float
    severity: float
    priority_score: float     


@dataclass(order=True)
class _SearchNode:
    """Internal A* frontier node (ordered by f-cost)."""
    f: float
    g: float = field(compare=False)
    repaired: frozenset = field(compare=False)
    path: tuple = field(compare=False)       # tuple of segment IDs in repair order
    counter: int = field(compare=False)       # tie-breaker


# Planner 

class AStarRepairPlanner:
    """
    A* search agent that finds the optimal repair sequence for a set of
    damaged road segments, minimising total weighted cost.
    """

    def __init__(self, segments: List[RoadSegment]):
        self.segments: Dict[int, RoadSegment] = {s.id: s for s in segments}
        self._min_costs: Dict[int, float] = {}
        for s in segments:
            self._min_costs[s.id] = self._repair_cost(s)

    # cost helpers 

    @staticmethod
    def _repair_cost(seg: RoadSegment) -> float:
        """
        Compute the real repair cost for a segment.
        cost = base_cost_factor × (1 + severity) × area_factor × traffic_importance
        """
        _, base_cost, _, _ = REPAIR_CATALOGUE.get(seg.damage_type, DEFAULT_REPAIR)
        area_factor = max(seg.relative_area * 100, 0.1)  # scale up for readability
        return base_cost * (1.0 + seg.severity) * area_factor * seg.traffic_importance

    def _heuristic(self, repaired: frozenset) -> float:
        """
        Admissible heuristic: sum of minimum repair costs for all unrepaired
        segments.  
        """
        return sum(
            cost for sid, cost in self._min_costs.items()
            if sid not in repaired
        )

    #  A* search  

    def plan(self) -> Dict:
    
        if not self.segments:
            return {
                "steps": [],
                "total_cost": 0.0,
                "total_hours": 0.0,
                "nodes_expanded": 0,
                "search_time_ms": 0.0,
                "segments_count": 0,
            }

        t0 = time.perf_counter()
        all_ids = frozenset(self.segments.keys())
        counter = 0

        start = _SearchNode(
            f=self._heuristic(frozenset()),
            g=0.0,
            repaired=frozenset(),
            path=(),
            counter=counter,
        )
        frontier: list = [start]
        visited: set = set()
        nodes_expanded = 0

        best_node: Optional[_SearchNode] = None

        while frontier:
            node = heapq.heappop(frontier)
            nodes_expanded += 1

            if node.repaired in visited:
                continue
            visited.add(node.repaired)

            # Goal check
            if node.repaired == all_ids:
                best_node = node
                break

            # Expand: try repairing each unrepaired segment
            for sid in all_ids - node.repaired:
                seg = self.segments[sid]
                step_cost = self._repair_cost(seg)
                new_g = node.g + step_cost
                new_repaired = node.repaired | {sid}
                new_h = self._heuristic(new_repaired)
                counter += 1
                child = _SearchNode(
                    f=new_g + new_h,
                    g=new_g,
                    repaired=new_repaired,
                    path=node.path + (sid,),
                    counter=counter,
                )
                heapq.heappush(frontier, child)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        # Build ordered repair steps
        steps: List[Dict] = []
        cumulative_cost = 0.0
        cumulative_hours = 0.0

        if best_node:
            for rank, sid in enumerate(best_node.path, start=1):
                seg = self.segments[sid]
                action_name, _, desc, hours_per_unit = REPAIR_CATALOGUE.get(
                    seg.damage_type, DEFAULT_REPAIR
                )
                cost = self._repair_cost(seg)
                hours = hours_per_unit * max(seg.relative_area * 50, 0.5)
                cumulative_cost += cost
                cumulative_hours += hours

                # Priority score 
                priority = seg.severity * seg.traffic_importance * (1 + seg.confidence)

                steps.append({
                    "rank": rank,
                    "segment_id": sid,
                    "damage_type": seg.damage_type,
                    "action": action_name,
                    "description": desc,
                    "severity": round(seg.severity, 4),
                    "confidence": round(seg.confidence, 4),
                    "relative_area": round(seg.relative_area, 6),
                    "bbox": list(seg.bbox),
                    "cost": round(cost, 2),
                    "estimated_hours": round(hours, 2),
                    "cumulative_cost": round(cumulative_cost, 2),
                    "priority_score": round(priority, 4),
                })

        return {
            "steps": steps,
            "total_cost": round(cumulative_cost, 2),
            "total_hours": round(cumulative_hours, 2),
            "nodes_expanded": nodes_expanded,
            "search_time_ms": round(elapsed_ms, 2),
            "segments_count": len(self.segments),
        }


# detection dicts → RoadSegment objects 

def build_segments_from_detections(
    detections: List[Dict],
    severity_index: float,
) -> List[RoadSegment]:
    """
    Convert the list of detection dicts (from _run_inference) into
    RoadSegment objects suitable for the A* planner.

    Traffic importance is derived from the overall severity grade.
    """
    grade = _grade(severity_index)
    traffic_imp = TRAFFIC_WEIGHT_BY_GRADE.get(grade, 1.0)

    segments: List[RoadSegment] = []
    for i, det in enumerate(detections):
        # Compute a per-detection severity proxy from contribution + confidence
        severity_proxy = min(
            det["contribution"] * 20 + det["confidence"] * 0.3,
            1.0,
        )
        seg = RoadSegment(
            id=i,
            damage_type=det["class_name"],
            severity=severity_proxy,
            confidence=det["confidence"],
            relative_area=det["relative_area"],
            bbox=tuple(det["bbox"]),
            traffic_importance=traffic_imp,
        )
        segments.append(seg)

    return segments
