import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

/**
 * Sleep Score Predictor using TensorFlow.js KNN
 * Predicts sleep score based on sleep metrics
 */
class SleepScorePredictor {
  constructor() {
    this.knnModel = knnClassifier.create();
    this.initialized = false;
    this.featureRanges = {
      duration: { min: 4, max: 10 },  // 4-10 hours
      quality: { min: 0, max: 100 },  // 0-100 score
      consistency: { min: 0, max: 20 } // 0-20 score
    };
    
    // KNN specific parameters
    this.kNeighbors = 5; // Default number of neighbors for KNN
    
    // Debugging configuration
    this.debug = {
      enabled: false,           // Main debug flag
      logLevel: 'info',         // 'error', 'warn', 'info', 'debug', 'verbose'
      storeExamples: true,      // Store training examples for inspection
      trackPerformance: true,   // Track prediction accuracy metrics
      maxExamplesToStore: 500   // Limit examples stored to avoid memory issues
    };
    
    // Store for debugging data
    this._debugData = {
      trainingExamples: [],
      predictions: [],
      performanceMetrics: {
        totalPredictions: 0,
        successfulPredictions: 0,
        failedPredictions: 0,
        predictionTimes: []
      }
    };

    // Confidence thresholds for prediction reliability
    this.confidenceThresholds = {
      high: 0.75,     // 75% or higher is considered high confidence
      medium: 0.45,   // 45-75% is medium confidence
      low: 0.25       // Below 25% is very low confidence
    };
  }

  /**
   * Set the number of neighbors used for KNN prediction
   * @param {number} k - Number of neighbors to use (must be positive integer)
   * @returns {boolean} - Whether the setting was successful
   */
  setKNeighbors(k) {
    if (!Number.isInteger(k) || k <= 0) {
      this._debugLog('error', `Invalid k value: ${k}. Must be a positive integer.`);
      return false;
    }
    
    this.kNeighbors = k;
    this._debugLog('info', `Number of neighbors (k) set to: ${k}`);
    return true;
  }

  /**
   * Enable or configure debugging
   * @param {boolean|Object} options - Enable/disable debug or config object
   */
  setDebugMode(options) {
    if (typeof options === 'boolean') {
      this.debug.enabled = options;
      this._debugLog('info', `Debug mode ${options ? 'enabled' : 'disabled'}`);
    } else if (typeof options === 'object') {
      this.debug = { ...this.debug, ...options };
      this._debugLog('info', `Debug configuration updated: ${JSON.stringify(this.debug)}`);
    }
  }

  /**
   * Internal debug logging method
   * @param {string} level - Log level ('error', 'warn', 'info', 'debug', 'verbose')
   * @param {string} message - Message to log
   * @param {any} data - Optional data to include
   */
  _debugLog(level, message, data) {
    const logLevels = {
      'error': 0,
      'warn': 1,
      'info': 2,
      'debug': 3,
      'verbose': 4
    };
    
    // Only log if debug is enabled and level is appropriate
    if (this.debug.enabled && logLevels[level] <= logLevels[this.debug.logLevel]) {
      console[level](message, data || '');
    }
  }

  // Normalize features to 0-1 range for better KNN performance
  normalizeFeature(value, featureType) {
    const { min, max } = this.featureRanges[featureType];
    return (value - min) / (max - min);
  }

  // Convert normalized value back to original scale
  denormalizeValue(value, min = 0, max = 100) {
    return value * (max - min) + min;
  }

  // Train model with historical sleep data
  async train(trainingData) {
    if (!trainingData || trainingData.length === 0) return;
    
    trainingData.forEach(item => {
      // Create feature tensor [duration, quality, consistency]
      const features = tf.tensor([
        this.normalizeFeature(item.avgDuration, 'duration'),
        this.normalizeFeature(item.avgQuality, 'quality'),
        this.normalizeFeature(item.consistencyScore, 'consistency')
      ]);
      
      // Add example with normalized sleep score
      this.knnModel.addExample(features, item.sleepScore / 100);
      
      // Store example for debugging if enabled
      if (this.debug.enabled && this.debug.storeExamples) {
        this._debugData.trainingExamples.push({ features, label: item.sleepScore / 100 });
        if (this._debugData.trainingExamples.length > this.debug.maxExamplesToStore) {
          this._debugData.trainingExamples.shift();
        }
      }
    });
    
    this.initialized = true;
    console.log('KNN model trained with', trainingData.length, 'examples');
  }

  /**
   * Predict sleep score based on input features
   * Now returns confidence information along with prediction
   * @param {number} avgDuration - Average sleep duration
   * @param {number} avgQuality - Average sleep quality
   * @param {number} consistencyScore - Sleep consistency score
   * @returns {Object} - Prediction result with score and confidence
   */
  async predict(avgDuration, avgQuality, consistencyScore) {
    if (!this.initialized) {
      console.warn('KNN model not initialized, returning null');
      return { 
        score: null, 
        confidence: 0, 
        confidenceLevel: 'none',
        message: 'Model not initialized'
      };
    }
    
    try {
      const features = tf.tensor([
        this.normalizeFeature(avgDuration, 'duration'),
        this.normalizeFeature(avgQuality, 'quality'),
        this.normalizeFeature(consistencyScore, 'consistency')
      ]);
      
      const startTime = performance.now();
      
      // Use the configured k neighbors value when making predictions
      const result = await this.knnModel.predictClass(features, this.kNeighbors);
      
      const endTime = performance.now();
      
      const predictedScoreNormalized = result.label;
      const predictedScore = Math.round(this.denormalizeValue(predictedScoreNormalized));
      
      // Get confidence value (how certain the prediction is)
      const confidence = result.confidences[result.label];
      const confidenceLevel = this.getConfidenceLevel(confidence);
      
      // Generate appropriate confidence message
      const confidenceMessage = this.generateConfidenceMessage(confidenceLevel, confidence);
      
      // Track performance metrics if enabled
      if (this.debug.enabled && this.debug.trackPerformance) {
        this._debugData.performanceMetrics.totalPredictions++;
        if (predictedScore !== null) {
          this._debugData.performanceMetrics.successfulPredictions++;
        } else {
          this._debugData.performanceMetrics.failedPredictions++;
        }
        this._debugData.performanceMetrics.predictionTimes.push(endTime - startTime);
        
        // Store prediction details for debugging
        if (this.debug.storeExamples) {
          this._debugData.predictions.push({
            input: { avgDuration, avgQuality, consistencyScore },
            output: predictedScore,
            k: this.kNeighbors,
            confidence,
            confidenceLevel,
            timeMs: endTime - startTime
          });
          
          // Limit stored predictions
          if (this._debugData.predictions.length > this.debug.maxExamplesToStore) {
            this._debugData.predictions.shift();
          }
        }
      }
      
      // Return extended prediction information
      return {
        score: predictedScore,
        confidence,
        confidenceLevel,
        message: confidenceMessage,
        predictionTimeMs: endTime - startTime
      };
    } catch (error) {
      console.error('Error predicting sleep score:', error);
      
      // Track failed prediction if enabled
      if (this.debug.enabled && this.debug.trackPerformance) {
        this._debugData.performanceMetrics.failedPredictions++;
      }
      
      return {
        score: null,
        confidence: 0,
        confidenceLevel: 'error',
        message: `Prediction error: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * Determine confidence level based on confidence score
   * @param {number} confidence - Raw confidence score (0-1)
   * @returns {string} - Confidence level descriptor
   */
  getConfidenceLevel(confidence) {
    if (confidence >= this.confidenceThresholds.high) return 'high';
    if (confidence >= this.confidenceThresholds.medium) return 'medium';
    if (confidence >= this.confidenceThresholds.low) return 'low';
    return 'very low';
  }
  
  /**
   * Generate human-readable message about prediction confidence
   * @param {string} level - Confidence level
   * @param {number} confidence - Raw confidence score
   * @returns {string} - Human-readable confidence message
   */
  generateConfidenceMessage(level, confidence) {
    const percentage = Math.round(confidence * 100);
    
    switch(level) {
      case 'high':
        return `High confidence prediction (${percentage}%)`;
      case 'medium':
        return `Moderate confidence prediction (${percentage}%)`;
      case 'low':
        return `Low confidence prediction (${percentage}%). Consider using traditional calculation.`;
      case 'very low':
        return `Very low confidence (${percentage}%). Results may not be reliable.`;
      case 'error':
        return 'Error occurred during prediction.';
      default:
        return `Unknown confidence level (${percentage}%).`;
    }
  }

  /**
   * Runs experiments with different k values to find optimal setting
   * @param {Array} testData - Test dataset with known labels
   * @param {Array} kValues - Array of k values to test
   * @returns {Object} - Results of experiments
   */
  async optimizeKValue(testData, kValues = [1, 3, 5, 7, 9]) {
    if (!this.initialized || !testData || testData.length === 0) {
      this._debugLog('error', 'Cannot optimize k: Model not initialized or no test data');
      return null;
    }
    
    const results = {};
    
    for (const k of kValues) {
      let totalError = 0;
      let successCount = 0;
      
      // Save original k value to restore later
      const originalK = this.kNeighbors;
      this.kNeighbors = k;
      
      for (const item of testData) {
        try {
          const predictedScore = await this.predict(
            item.avgDuration,
            item.avgQuality,
            item.consistencyScore
          );
          
          if (predictedScore !== null) {
            const error = Math.abs(predictedScore - item.sleepScore);
            totalError += error;
            successCount++;
          }
        } catch (err) {
          this._debugLog('warn', `Error during k optimization for k=${k}:`, err);
        }
      }
      
      // Calculate average error
      const avgError = successCount > 0 ? totalError / successCount : Infinity;
      results[k] = { 
        avgError,
        successRate: successCount / testData.length
      };
      
      this._debugLog('info', `K=${k}: Avg Error=${avgError.toFixed(2)}, Success Rate=${(results[k].successRate * 100).toFixed(1)}%`);
    }
    
    // Find best k value (lowest error)
    let bestK = kValues[0];
    let lowestError = results[bestK].avgError;
    
    for (const k of kValues) {
      if (results[k].avgError < lowestError) {
        lowestError = results[k].avgError;
        bestK = k;
      }
    }
    
    this._debugLog('info', `Best k value: ${bestK} with average error: ${lowestError.toFixed(2)}`);
    
    // Set the best k value
    this.kNeighbors = bestK;
    
    return {
      bestK,
      lowestError,
      allResults: results
    };
  }
  
  /**
   * Generate synthetic training data with realistic patterns and correlations
   * @returns {Array} - Array of training examples
   */
  generateTrainingData() {
    const trainingData = [];
    
    // Number of examples to generate
    const numExamples = 1000; // Increased from 500
    
    // Generate structured examples that follow realistic patterns
    for (let i = 0; i < numExamples; i++) {
      let avgDuration, avgQuality, consistencyScore, sleepScore;
      
      // Create examples based on common sleep patterns
      // Each iteration will create data points that follow realistic relationships
      
      if (i % 5 === 0) {
        // Optimal sleep pattern: 7-9 hours, high quality, high consistency
        avgDuration = 7 + (Math.random() * 2);  // 7-9 hours
        avgQuality = 70 + (Math.random() * 30); // 70-100 quality
        consistencyScore = 15 + (Math.random() * 5); // 15-20 consistency
        
        // Calculate expected sleep score for this pattern (high score)
        sleepScore = 40 + (avgQuality / 100 * 40) + consistencyScore;
        sleepScore = Math.min(100, Math.max(0, sleepScore + (Math.random() * 5 - 2.5)));
      } 
      else if (i % 5 === 1) {
        // Insufficient sleep pattern: 4-6 hours, medium quality, medium-low consistency
        avgDuration = 4 + (Math.random() * 2);  // 4-6 hours
        avgQuality = 30 + (Math.random() * 40); // 30-70 quality
        consistencyScore = 5 + (Math.random() * 9); // 5-14 consistency
        
        // Calculate expected sleep score for this pattern (low-medium score)
        sleepScore = 10 + (avgQuality / 100 * 40) + consistencyScore;
        sleepScore = Math.min(100, Math.max(0, sleepScore + (Math.random() * 5 - 2.5)));
      }
      else if (i % 5 === 2) {
        // Oversleeping pattern: 9-11 hours, medium quality, medium consistency
        avgDuration = 9 + (Math.random() * 2);  // 9-11 hours
        avgQuality = 40 + (Math.random() * 30); // 40-70 quality
        consistencyScore = 8 + (Math.random() * 7); // 8-15 consistency
        
        // Calculate expected sleep score for this pattern (medium score)
        sleepScore = 20 + (avgQuality / 100 * 40) + consistencyScore;
        sleepScore = Math.min(100, Math.max(0, sleepScore + (Math.random() * 5 - 2.5)));
      }
      else if (i % 5 === 3) {
        // Poor sleep pattern: 3-5 hours, poor quality, poor consistency
        avgDuration = 3 + (Math.random() * 2);  // 3-5 hours
        avgQuality = 10 + (Math.random() * 30); // 10-40 quality
        consistencyScore = 0 + (Math.random() * 7); // 0-7 consistency
        
        // Calculate expected sleep score for this pattern (very low score)
        sleepScore = 10 + (avgQuality / 100 * 30) + consistencyScore;
        sleepScore = Math.min(100, Math.max(0, sleepScore + (Math.random() * 5 - 2.5)));
      }
      else {
        // Average sleep pattern: 6-7.5 hours, average quality, average consistency
        avgDuration = 6 + (Math.random() * 1.5);  // 6-7.5 hours
        avgQuality = 50 + (Math.random() * 30); // 50-80 quality
        consistencyScore = 10 + (Math.random() * 7); // 10-17 consistency
        
        // Calculate expected sleep score for this pattern (medium-high score)
        sleepScore = 30 + (avgQuality / 100 * 40) + consistencyScore;
        sleepScore = Math.min(100, Math.max(0, sleepScore + (Math.random() * 5 - 2.5)));
      }
      
      // Add minor variations to avoid exact patterns (reduced noise compared to previous version)
      avgDuration = Math.max(this.featureRanges.duration.min, Math.min(this.featureRanges.duration.max, avgDuration));
      avgQuality = Math.max(0, Math.min(100, avgQuality));
      consistencyScore = Math.max(0, Math.min(20, consistencyScore));
      sleepScore = Math.round(Math.max(0, Math.min(100, sleepScore)));
      
      trainingData.push({
        avgDuration,
        avgQuality,
        consistencyScore,
        sleepScore
      });
    }
    
    // Add additional edge case examples to ensure comprehensive coverage
    // Very short sleep with unexpectedly good quality
    trainingData.push({
      avgDuration: 4.2,
      avgQuality: 75,
      consistencyScore: 15,
      sleepScore: 55
    });
    
    // Very long sleep with poor quality
    trainingData.push({
      avgDuration: 10.5,
      avgQuality: 30,
      consistencyScore: 10,
      sleepScore: 45
    });
    
    // Perfect sleep parameters
    trainingData.push({
      avgDuration: 8.0,
      avgQuality: 95,
      consistencyScore: 19,
      sleepScore: 98
    });
    
    // Worst sleep parameters
    trainingData.push({
      avgDuration: 3.5,
      avgQuality: 15,
      consistencyScore: 3,
      sleepScore: 15
    });
    
    // Log data distribution statistics for debugging
    this._calculateDatasetStatistics(trainingData);
    
    return trainingData;
  }
  
  /**
   * Calculate and log statistics about the training dataset
   * @param {Array} trainingData - The training dataset
   */
  _calculateDatasetStatistics(trainingData) {
    if (!trainingData || trainingData.length === 0) return;
    
    // Calculate averages and distributions for debugging
    const stats = {
      count: trainingData.length,
      avgDuration: {
        min: Infinity,
        max: -Infinity,
        avg: 0,
        distribution: { '3-5': 0, '5-7': 0, '7-9': 0, '9+': 0 }
      },
      avgQuality: {
        min: Infinity,
        max: -Infinity,
        avg: 0,
        distribution: { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 }
      },
      consistencyScore: {
        min: Infinity,
        max: -Infinity,
        avg: 0,
        distribution: { '0-5': 0, '5-10': 0, '10-15': 0, '15-20': 0 }
      },
      sleepScore: {
        min: Infinity,
        max: -Infinity,
        avg: 0,
        distribution: { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 }
      }
    };
    
    trainingData.forEach(item => {
      // Update min/max values
      stats.avgDuration.min = Math.min(stats.avgDuration.min, item.avgDuration);
      stats.avgDuration.max = Math.max(stats.avgDuration.max, item.avgDuration);
      stats.avgQuality.min = Math.min(stats.avgQuality.min, item.avgQuality);
      stats.avgQuality.max = Math.max(stats.avgQuality.max, item.avgQuality);
      stats.consistencyScore.min = Math.min(stats.consistencyScore.min, item.consistencyScore);
      stats.consistencyScore.max = Math.max(stats.consistencyScore.max, item.consistencyScore);
      stats.sleepScore.min = Math.min(stats.sleepScore.min, item.sleepScore);
      stats.sleepScore.max = Math.max(stats.sleepScore.max, item.sleepScore);
      
      // Update averages
      stats.avgDuration.avg += item.avgDuration;
      stats.avgQuality.avg += item.avgQuality;
      stats.consistencyScore.avg += item.consistencyScore;
      stats.sleepScore.avg += item.sleepScore;
      
      // Update distributions
      if (item.avgDuration < 5) stats.avgDuration.distribution['3-5']++;
      else if (item.avgDuration < 7) stats.avgDuration.distribution['5-7']++;
      else if (item.avgDuration < 9) stats.avgDuration.distribution['7-9']++;
      else stats.avgDuration.distribution['9+']++;
      
      if (item.avgQuality < 25) stats.avgQuality.distribution['0-25']++;
      else if (item.avgQuality < 50) stats.avgQuality.distribution['25-50']++;
      else if (item.avgQuality < 75) stats.avgQuality.distribution['50-75']++;
      else stats.avgQuality.distribution['75-100']++;
      
      if (item.consistencyScore < 5) stats.consistencyScore.distribution['0-5']++;
      else if (item.consistencyScore < 10) stats.consistencyScore.distribution['5-10']++;
      else if (item.consistencyScore < 15) stats.consistencyScore.distribution['10-15']++;
      else stats.consistencyScore.distribution['15-20']++;
      
      if (item.sleepScore < 25) stats.sleepScore.distribution['0-25']++;
      else if (item.sleepScore < 50) stats.sleepScore.distribution['25-50']++;
      else if (item.sleepScore < 75) stats.sleepScore.distribution['50-75']++;
      else stats.sleepScore.distribution['75-100']++;
    });
    
    // Calculate final averages
    stats.avgDuration.avg /= trainingData.length;
    stats.avgQuality.avg /= trainingData.length;
    stats.consistencyScore.avg /= trainingData.length;
    stats.sleepScore.avg /= trainingData.length;
    
    // Log statistics
    if (this.debug.enabled) {
      this._debugLog('info', 'Training data statistics:', JSON.stringify(stats, null, 2));
    } else {
      console.log('Generated training dataset with', stats.count, 'examples');
    }
  }
  
  /**
   * Initialize model with improved training data and optimized k value
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Generate higher quality training data
      const trainingData = this.generateTrainingData();
      
      // Train the model with the improved data
      await this.train(trainingData);
      
      // Automatically optimize k for best results
      const testData = trainingData.slice(0, 100); // Use a subset for testing
      await this.optimizeKValue(testData, [3, 5, 7, 9, 11]);
      
      console.log(`KNN model initialized with ${trainingData.length} examples and optimal k=${this.kNeighbors}`);
    } catch (err) {
      console.error('Error initializing sleep score predictor:', err);
    }
  }
  
  /**
   * Get debug information and model stats
   * @returns {Object} - Debugging information and model statistics
   */
  getDebugInfo() {
    return {
      modelInitialized: this.initialized,
      kNeighbors: this.kNeighbors,
      featureRanges: this.featureRanges,
      debugConfig: this.debug,
      metrics: this._debugData.performanceMetrics,
      predictionHistory: this.debug.storeExamples ? 
        this._debugData.predictions : 'Prediction storage disabled',
      trainingExamplesCount: this._debugData.trainingExamples.length,
      avgPredictionTime: this._debugData.performanceMetrics.predictionTimes.length > 0 ?
        this._debugData.performanceMetrics.predictionTimes.reduce((a, b) => a + b, 0) / 
        this._debugData.performanceMetrics.predictionTimes.length : 0
    };
  }
}

// Create and export singleton instance
const sleepScorePredictor = new SleepScorePredictor();
export default sleepScorePredictor;
