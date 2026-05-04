import { usePrediction } from '../hooks/usePrediction';
import { usePredictionContext } from '../context/PredictionContext';
import MatchSetup from '../components/predictor/MatchSetup';
import WinnerBanner from '../components/predictor/WinnerBanner';
import ProbabilityArc from '../components/predictor/ProbabilityArc';
import FactorsCard from '../components/predictor/FactorsCard';
import KeyPlayersCard from '../components/predictor/KeyPlayersCard';
import LoadingScreen from '../components/common/LoadingScreen';

export default function Predictor() {
  const { result, loading, error, predict } = usePrediction();
  const { addToHistory } = usePredictionContext();

  const handlePredict = async (data) => {
    const res = await predict(data);
    if (res) addToHistory(res);
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 24 }}>🎯 Match Predictor</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          XGBoost + LightGBM ensemble · 55 features · SHAP-explained predictions
        </p>

        <div className="card" style={{ marginBottom: 32 }}>
          <MatchSetup onPredict={handlePredict} loading={loading} />
        </div>

        {loading && <LoadingScreen message="Analysing 17 seasons of IPL data..." />}

        {error && (
          <div className="card" style={{ borderColor: 'var(--danger)', textAlign: 'center', padding: 24 }}>
            <p style={{ color: 'var(--danger)', fontSize: 15 }}>❌ {error}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
              Make sure the ML service is running: <code>uvicorn main:app --port 8000</code>
            </p>
          </div>
        )}

        {result && !loading && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <WinnerBanner
              winner={result.predictedWinner}
              confidence={result.confidence}
              team1={result.team1}
              team2={result.team2}
            />

            <h3 className="section-title">Win Probability</h3>
            <ProbabilityArc
              team1={result.team1}
              team2={result.team2}
              team1Prob={result.team1WinProb}
              team2Prob={result.team2WinProb}
            />

            <h3 className="section-title" style={{ marginTop: 32 }}>Venue Context</h3>
            <KeyPlayersCard venueInfo={result.venueInfo} />

            <FactorsCard
              shapFactors={result.shapFactors}
              team1={result.team1}
              team2={result.team2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
