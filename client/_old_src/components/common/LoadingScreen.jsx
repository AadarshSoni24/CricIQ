import './LoadingScreen.css';

export default function LoadingScreen({ message = 'Analysing IPL data...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <span className="spinner-icon">🏏</span>
      </div>
      <p className="loading-message">{message}</p>
      <div className="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}
