/**
 * CricIQ — IPL Data Ingestion Script
 * =================================
 * Parses ball-by-ball JSON files from ipl_male_json directory,
 * aggregates stats by UUID, and saves to MongoDB.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Player = require('../models/Player');

const DATA_DIR = path.join(__dirname, '../../ipl_male_json');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/criciq';

// Manual mapping for full names that might not be in the short names
const FULL_NAME_MAPPINGS = {
  'fcc21ace': 'Anshul Kamboj',
  '740742ef': 'Rohit Sharma',
  '271f83cd': 'Suryakumar Yadav',
  'dbe50b21': 'Hardik Pandya',
  '462411b3': 'Jasprit Bumrah',
  '235c2bb6': 'Heinrich Klaasen',
  '12b610c2': 'Travis Head',
  '752f7486': 'Ishan Kishan',
  'aad0c365': 'Nithish Kumar Reddy',
};

async function ingest() {
  try {
    console.log('🚀 Starting ingestion...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} JSON files`);

    const playersMap = new Map(); // uuid -> data

    let processedCount = 0;
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      const registry = data.info.registry?.people || {};
      
      // Update names and aliases
      for (const [shortName, uuid] of Object.entries(registry)) {
        if (!playersMap.has(uuid)) {
          playersMap.set(uuid, {
            uuid,
            name: FULL_NAME_MAPPINGS[uuid] || shortName,
            aliases: new Set([shortName]),
            batting: { runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, innings: 0, dismissals: 0 },
            bowling: { wickets: 0, runs: 0, balls: 0, dots: 0, wide: 0, noball: 0 },
            matches: new Set()
          });
        }
        playersMap.get(uuid).aliases.add(shortName);
      }

      // Process Innings
      if (data.innings) {
        data.innings.forEach(inning => {
          inning.overs?.forEach(over => {
            over.deliveries?.forEach(delivery => {
              const batterName = delivery.batter;
              const bowlerName = delivery.bowler;
              const runs = delivery.runs.batter;
              const extras = delivery.runs.extras;
              const totalRuns = delivery.runs.total;

              const batterUuid = registry[batterName];
              const bowlerUuid = registry[bowlerName];

              if (batterUuid && playersMap.has(batterUuid)) {
                const b = playersMap.get(batterUuid);
                b.batting.runs += runs;
                b.batting.balls += 1; // Simplification: every delivery recorded is a ball (except some extras)
                if (delivery.extras?.wides) b.batting.balls -= 1; 
                if (runs === 4) b.batting.fours += 1;
                if (runs === 6) b.batting.sixes += 1;
                if (runs === 0) b.batting.dots += 1;
                b.matches.add(file);
              }

              if (bowlerUuid && playersMap.has(bowlerUuid)) {
                const bw = playersMap.get(bowlerUuid);
                bw.bowling.runs += (runs + (delivery.extras?.wides || 0) + (delivery.extras?.noballs || 0));
                bw.bowling.balls += 1;
                if (delivery.extras?.wides || delivery.extras?.noballs) bw.bowling.balls -= 1;
                if (runs === 0 && !delivery.extras) bw.bowling.dots += 1;
                if (delivery.wickets) {
                   delivery.wickets.forEach(w => {
                     if (!['run out', 'retired hurt', 'obstructing the field'].includes(w.kind)) {
                       bw.bowling.wickets += 1;
                     }
                   });
                }
              }

              // Wickets for batting stats
              if (delivery.wickets) {
                delivery.wickets.forEach(w => {
                  const outUuid = registry[w.player_out];
                  if (outUuid && playersMap.has(outUuid)) {
                    playersMap.get(outUuid).batting.dismissals += 1;
                  }
                });
              }
            });
          });
        });
      }

      processedCount++;
      if (processedCount % 100 === 0) console.log(`  Processed ${processedCount} files...`);
    }

    console.log('💾 Saving to MongoDB...');
    
    // Clear existing players to avoid duplicates if UUIDs changed (optional)
    // await Player.deleteMany({}); 

    const bulkOps = [];
    for (const p of playersMap.values()) {
      const battingSR = p.batting.balls > 0 ? (p.batting.runs / p.batting.balls) * 100 : 0;
      const battingAvg = p.batting.dismissals > 0 ? (p.batting.runs / p.batting.dismissals) : p.batting.runs;
      const bowlingEcon = p.bowling.balls > 0 ? (p.bowling.runs / (p.bowling.balls / 6)) : 0;
      const bowlingSR = p.bowling.wickets > 0 ? (p.bowling.balls / p.bowling.wickets) : 0;

      // Infer role
      let role = 'batter';
      if (p.bowling.balls > p.batting.balls * 2) role = 'bowler';
      if (p.batting.balls > 50 && p.bowling.balls > 50) role = 'allrounder';

      bulkOps.push({
        updateOne: {
          filter: { uuid: p.uuid },
          update: {
            $set: {
              name: p.name,
              uuid: p.uuid,
              aliases: Array.from(p.aliases),
              role: role,
              stats: {
                batting: {
                  runs: p.batting.runs,
                  balls: p.batting.balls,
                  sr: battingSR,
                  avg: battingAvg,
                  innings: p.matches.size, // Approximation
                  fours: p.batting.fours,
                  sixes: p.batting.sixes,
                  dotPct: p.batting.balls > 0 ? (p.batting.dots / p.batting.balls) * 100 : 0
                },
                bowling: {
                  wickets: p.bowling.wickets,
                  economy: bowlingEcon,
                  sr: bowlingSR,
                  balls: p.bowling.balls
                }
              },
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Player.bulkWrite(bulkOps);
    }

    console.log(`✅ Ingestion complete! Saved ${playersMap.size} players.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
  }
}

ingest();
