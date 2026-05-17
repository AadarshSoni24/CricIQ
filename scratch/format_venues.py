import pandas as pd
import json

df = pd.read_csv('c:/Users/aadar/CricIQ/venue_features.csv')
venues = []
for _, row in df.iterrows():
    name = row['venue']
    # try to guess city or just use name
    city = name.split(',')[-1].strip() if ',' in name else name
    venues.append({
        'id': name.lower().replace(' ', '_').replace(',', ''),
        'name': name,
        'city': city,
        'avgScore': int(row['avg_1st_innings']),
        'batFirstWin': int(row['bat_first_win_pct'] * 100),
        'pitch': row['pitch_dna'].replace('_', ' ').title()
    })

print(json.dumps(venues, indent=2))
