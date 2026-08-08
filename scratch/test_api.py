import sys
import os

# Add ml folder to python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "..", "ml"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# 1. Test Predict
print("=== Testing /ml/predict endpoint ===")
payload = {
    "team1": "Chennai Super Kings",
    "team2": "Mumbai Indians",
    "venue": "Wankhede Stadium, Mumbai",
    "toss_winner": "Chennai Super Kings",
    "toss_decision": "field",
    "team1_form5": 0.6,
    "team2_form5": 0.4,
    "team1_form10": 0.55,
    "team2_form10": 0.5,
    "h2h_winrate": 0.52,
    "season_year": 2026
}
response = client.post("/ml/predict", json=payload)
print("Status Code:", response.status_code)
if response.status_code == 200:
    data = response.json()
    print("Predicted Winner:", data.get("predictedWinner"))
    print("Team 1 Win Prob:", data.get("team1WinProb"), "%")
    print("Team 2 Win Prob:", data.get("team2WinProb"), "%")
    print("Confidence:", data.get("confidence"), "%")
    print("\nSHAP Explanations:")
    for i, f in enumerate(data.get("shapFactors", [])):
        print(f" {i+1}. Factor: {f['factor']}")
        print(f"    plainText: {f['plainText']}")
        print(f"    impactPct: {f['impactPct']}%")
        print(f"    favorsTeam: {f['favorsTeam']}")
else:
    print("Error:", response.text)

# 2. Test Live Squad (Mock confirmed)
print("\n=== Testing /ml/live-squad (Confirmed Mock) ===")
payload_squad = {
    "team1": "Chennai Super Kings",
    "team2": "Mumbai Indians"
}
response_squad = client.post("/ml/live-squad", json=payload_squad)
print("Status Code:", response_squad.status_code)
print("Response:", response_squad.json())

# 3. Test Live Squad (Not confirmed fallback)
print("\n=== Testing /ml/live-squad (Not Confirmed Fallback) ===")
payload_squad_unc = {
    "team1": "Gujarat Titans",
    "team2": "Delhi Capitals"
}
response_squad_unc = client.post("/ml/live-squad", json=payload_squad_unc)
print("Status Code:", response_squad_unc.status_code)
print("Response:", response_squad_unc.json())
