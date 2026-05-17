import json
import os

folder = r"c:\Users\aadar\CricIQ\ipl_male_json"
files = [f for f in os.listdir(folder) if f.endswith(".json")]

for i in range(min(5, len(files))):
    with open(os.path.join(folder, files[i]), "r") as f:
        data = json.load(f)
        print(f"File: {files[i]}")
        print(f"Info keys: {list(data['info'].keys())}")
        if "registry" in data["info"]:
            print(f"Registry keys: {list(data['info']['registry'].keys())}")
        print("-" * 20)
