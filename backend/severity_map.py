
import folium
from routingpy import OSRM


detections = [
    {"name": "Suryabinayak", "lat": 27.66592126389908, "lon": 85.42258307866899, "severity": 0.52, "label": "Moderate"},
    {"name": "Jagati", "lat": 27.666350504892222, "lon": 85.43794678212379, "severity": 0.81, "label": "Minor"},
    {"name": "Nalinchowk", "lat": 27.652046985743315, "lon": 85.46143719124431, "severity": 0.47, "label": "Moderate"},
    {"name": "Sanga", "lat": 27.64301840572228, "lon": 85.46859387942017, "severity": 0.73, "label": "Critical"},
    {"name": "Banepa", "lat": 27.631333552456663, "lon": 85.51814705991903, "severity": 0.61, "label": "Moderate"},
    {"name": "Dhulikhel", "lat": 27.619442532475738, "lon": 85.55311016550378, "severity": 0.92, "label": "Critical"}
]

# MAP


m = folium.Map(
    location=[27.667, 85.44],
    zoom_start=11
)

client = OSRM(base_url="https://router.project-osrm.org")

# DRAW ROAD ROUTES


for i in range(len(detections) - 1):

    start = detections[i]
    end = detections[i + 1]

    avg_severity = (start["severity"] + end["severity"]) / 2

    if avg_severity < 0.3:
        road_color = "green"
    elif avg_severity < 0.7:
        road_color = "orange"
    else:
        road_color = "red"

    try:
        route = client.directions(
            locations=[
                [start["lon"], start["lat"]],
                [end["lon"], end["lat"]]
            ],
            profile="driving"
        )

        coordinates = route.geometry

        route_points = [
            [coord[1], coord[0]]
            for coord in coordinates
        ]

        folium.PolyLine(
            route_points,
            color=road_color,
            weight=7,
            opacity=0.85,
            tooltip=f"{start['name']} → {end['name']}"
        ).add_to(m)

    except Exception as e:
        print(f"Routing failed for {start['name']} → {end['name']}: {e}")

# MARKERS

for d in detections:

    if d["severity"] < 0.3:
        marker_color = "green"
    elif d["severity"] < 0.7:
        marker_color = "orange"
    else:
        marker_color = "red"

    folium.Marker(
        [d["lat"], d["lon"]],
        popup=f"""
        <b>{d['name']}</b><br>
        Severity: {d['severity']}<br>
        Category: {d['label']}
        """,
        icon=folium.Icon(color=marker_color)
    ).add_to(m)

# SAVE

m.save("../frontend/public/severity_map.html")
print("Severity map generated successfully.")