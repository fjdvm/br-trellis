export interface ChurnThresholdConfig {
  churn_threshold: number;
}

export interface PriorityWeightsConfig {
  sentiment_weight: number;
  urgency_weight: number;
  history_weight: number;
}

export interface AnomalySensitivityConfig {
  sensitivity: number;
}

export interface ConfidenceThresholdsConfig {
  sentiment_threshold: number;
  category_threshold: number;
  nba_threshold: number;
  resolution_estimate_threshold: number;
}
