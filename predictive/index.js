/**
 * PREDICTIVE ANALYTICS ENGINE
 * ML-based predictions for customer behavior
 */

const { LearningEngine } = require('./learning-engine');

class PredictiveEngine {
  constructor() {
    this.learning = new LearningEngine();
    this.models = {};
  }
  
  // Predict customer lifetime value
  async predictCLV(leadData) {
    const { predictConversion } = await import('./learning-engine.js');
    const conversion = await this.learning.predictConversion(leadData);
    
    // CLV = conversion_probability * avg_order_value * num_purchases
    const avgOrderValue = 99; // From your pricing
    const predictedPurchases = conversion.probability * 12; // 12 months
    
    const clv = conversion.probability * avgOrderValue * predictedPurchases;
    
    return {
      predictedCLV: Math.round(clv * 100) / 100,
      confidence: conversion.confidence,
      factors: {
        conversionProbability: conversion.probability,
        avgOrderValue,
        predictedPurchases
      },
      recommendation: clv > 50 ? 'high_priority' : 'standard'
    };
  }
  
  // Predict churn risk
  async predictChurn(customerId, engagementMetrics) {
    // Factors that indicate churn risk
    let riskScore = 0;
    const factors = [];
    
    // No engagement in 30 days
    if (!engagementMetrics.lastActive || 
        Date.now() - new Date(engagementMetrics.lastActive).getTime() > 30 * 24 * 60 * 60 * 1000) {
      riskScore += 30;
      factors.push('No activity in 30 days');
    }
    
    // Low email open rate
    if (engagementMetrics.openRate < 20) {
      riskScore += 20;
      factors.push('Low email engagement');
    }
    
    // No purchases in 60 days
    if (!engagementMetrics.lastPurchase || 
        Date.now() - new Date(engagementMetrics.lastPurchase).getTime() > 60 * 24 * 60 * 60 * 1000) {
      riskScore += 40;
      factors.push('No recent purchases');
    }
    
    return {
      riskScore: Math.min(100, riskScore),
      level: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
      factors,
      recommendedAction: riskScore > 60 ? 'immediate_outreach' : 
                        riskScore > 30 ? 'send_reengagement' : 'continue_normal'
    };
  }
  
  // Predict best send time
  async predictBestSendTime() {
    const emailPerf = this.learning.loadMetrics('email_performance');
    
    if (emailPerf.length < 100) {
      return { bestTime: '10:00', day: 'Tuesday', confidence: 'low' };
    }
    
    // Analyze open rates by hour and day
    const byHour = {};
    const byDay = {};
    
    emailPerf.forEach(email => {
      if (email.opened) {
        const date = new Date(email.sentAt);
        const hour = date.getHours();
        const day = date.getDay();
        
        byHour[hour] = (byHour[hour] || 0) + 1;
        byDay[day] = (byDay[day] || 0) + 1;
      }
    });
    
    // Find best hour
    let bestHour = 10;
    let maxOpens = 0;
    Object.entries(byHour).forEach(([hour, count]) => {
      if (count > maxOpens) {
        maxOpens = count;
        bestHour = parseInt(hour);
      }
    });
    
    // Find best day
    let bestDay = 2; // Tuesday
    let maxDayOpens = 0;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    Object.entries(byDay).forEach(([day, count]) => {
      if (count > maxDayOpens) {
        maxDayOpens = count;
        bestDay = parseInt(day);
      }
    });
    
    return {
      bestTime: `${bestHour}:00`,
      day: days[bestDay],
      confidence: emailPerf.length > 500 ? 'high' : 'medium'
    };
  }
  
  // Recommend next best action
  async recommendNextAction(leadId, history) {
    const actions = [
      { type: 'email', subject: 'Follow up', expectedConversion: 0.15 },
      { type: 'call', subject: 'Personal call', expectedConversion: 0.25 },
      { type: 'discount', subject: 'Special offer', expectedConversion: 0.35 },
      { type: 'wait', reason: 'Not ready', expectedConversion: 0.05 }
    ];
    
    // Score each action based on history
    const scoredActions = actions.map(action => {
      let score = action.expectedConversion * 100;
      
      // Adjust based on history
      if (history.emailsSent > 3 && action.type === 'email') {
        score *= 0.5; // Diminishing returns
      }
      
      if (history.lastAction === 'discount' && action.type === 'discount') {
        score *= 0.3; // Don't keep discounting
      }
      
      return { ...action, score: Math.round(score * 100) / 100 };
    });
    
    // Sort by score
    scoredActions.sort((a, b) => b.score - a.score);
    
    return {
      recommended: scoredActions[0],
      alternatives: scoredActions.slice(1),
      reasoning: this.generateReasoning(history)
    };
  }
  
  generateReasoning(history) {
    if (history.emailsSent === 0) {
      return 'Start with initial outreach email';
    }
    if (history.emailsSent < 3) {
      return 'Continue nurturing with follow-ups';
    }
    if (history.lastAction === 'email' && history.lastResponse === 'none') {
      return 'Try a different approach - call or offer';
    }
    return 'Standard nurturing sequence';
  }
  
  // Anomaly detection
  async detectAnomalies(metrics) {
    const anomalies = [];
    
    // Unusual revenue drop
    if (metrics.revenueChange < -50) {
      anomalies.push({
        type: 'revenue_drop',
        severity: 'high',
        message: 'Revenue dropped more than 50% vs average',
        recommendation: 'Review recent changes to pricing or marketing'
      });
    }
    
    // Unusual email bounce rate
    if (metrics.bounceRate > 10) {
      anomalies.push({
        type: 'high_bounce',
        severity: 'medium',
        message: 'Email bounce rate is high',
        recommendation: 'Review email list quality'
      });
    }
    
    // Sudden traffic spike
    if (metrics.trafficChange > 200) {
      anomalies.push({
        type: 'traffic_spike',
        severity: 'low',
        message: 'Unusual traffic increase detected',
        recommendation: 'Investigate source - could be bot traffic'
      });
    }
    
    return anomalies;
  }
}

module.exports = { PredictiveEngine };
