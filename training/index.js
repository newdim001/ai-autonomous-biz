/**
 * AI TRAINING PIPELINE
 * Continuous learning and model improvement
 */

const fs = require('fs');
const path = require('path');
const { LearningEngine } = require('./learning-engine');

class TrainingPipeline {
  constructor() {
    this.learning = new LearningEngine();
    this.modelDir = path.join(__dirname, '../models');
    this.ensureModelDir();
    
    // Training schedule
    this.lastTraining = null;
    this.trainingInterval = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  ensureModelDir() {
    if (!fs.existsSync(this.modelDir)) {
      fs.mkdirSync(this.modelDir, { recursive: true });
    }
  }
  
  // Check if training is needed
  shouldTrain() {
    if (!this.lastTraining) return true;
    
    const timeSinceLast = Date.now() - this.lastTraining;
    return timeSinceLast > this.trainingInterval;
  }
  
  // Run training pipeline
  async train() {
    console.log('🧠 Starting AI training pipeline...');
    
    const results = {
      timestamp: new Date().toISOString(),
      models: []
    };
    
    // Train each model
    results.models.push(await this.trainSubjectLineModel());
    results.models.push(await this.trainPricingModel());
    results.models.push(await this.trainContentModel());
    results.models.push(await this.trainLeadScoringModel());
    
    // Save trained models
    this.saveModels(results.models);
    
    this.lastTraining = Date.now();
    
    console.log('✅ Training complete:', results);
    return results;
  }
  
  // Train subject line optimization model
  async trainSubjectLineModel() {
    const emailPerf = this.learning.loadMetrics('email_performance');
    
    if (emailPerf.length < 50) {
      return { name: 'subject_line', status: 'insufficient_data', samples: emailPerf.length };
    }
    
    // Extract features
    const features = emailPerf.map(email => ({
      subject: email.subject,
      length: email.subject.length,
      hasQuestion: email.subject.includes('?'),
      hasNumber: /\d/.test(email.subject),
      converted: email.converted
    }));
    
    // Calculate best patterns
    const patterns = this.analyzePatterns(features);
    
    const model = {
      type: 'subject_line',
      bestLength: patterns.avgLength,
      bestPatterns: patterns.topWords,
      avoidPatterns: patterns.avoidWords,
      trainedAt: new Date().toISOString(),
      accuracy: patterns.accuracy
    };
    
    return { name: 'subject_line', ...model };
  }
  
  // Train pricing model
  async trainPricingModel() {
    const pricing = this.learning.loadMetrics('pricing');
    
    if (pricing.length < 30) {
      return { name: 'pricing', status: 'insufficient_data', samples: pricing.length };
    }
    
    // Find optimal price points
    const accepted = pricing.filter(p => p.outcome === 'accepted');
    const rejected = pricing.filter(p => p.outcome === 'rejected');
    
    const acceptedPrices = accepted.map(p => p.price);
    const rejectedPrices = rejected.map(p => p.price);
    
    const minAccepted = Math.min(...acceptedPrices);
    const maxAccepted = Math.max(...acceptedPrices);
    const avgAccepted = acceptedPrices.reduce((a, b) => a + b, 0) / acceptedPrices.length;
    
    const model = {
      type: 'pricing',
      optimalRange: { min: minAccepted, max: maxAccepted },
      sweetSpot: Math.round(avgAccepted),
      rejectionThreshold: Math.max(...rejectedPrices),
      trainedAt: new Date().toISOString(),
      accuracy: accepted.length / pricing.length
    };
    
    return { name: 'pricing', ...model };
  }
  
  // Train content model
  async trainContentModel() {
    const content = this.learning.loadMetrics('content_performance');
    
    if (content.length < 20) {
      return { name: 'content', status: 'insufficient_data', samples: content.length };
    }
    
    // Find best content types
    const byType = {};
    content.forEach(c => {
      if (!byType[c.type]) byType[c.type] = { total: 0, conversions: 0 };
      byType[c.type].total++;
      byType[c.type].conversions += c.conversions;
    });
    
    const rankings = Object.entries(byType)
      .map(([type, stats]) => ({
        type,
        avgConversions: stats.conversions / stats.total,
        total: stats.total
      }))
      .sort((a, b) => b.avgConversions - a.avgConversions);
    
    const model = {
      type: 'content',
      bestTypes: rankings.slice(0, 3),
      worstTypes: rankings.slice(-2),
      trainedAt: new Date().toISOString()
    };
    
    return { name: 'content', ...model };
  }
  
  // Train lead scoring model
  async trainLeadScoringModel() {
    const conversions = this.learning.loadMetrics('conversions');
    
    if (conversions.length < 50) {
      return { name: 'lead_scoring', status: 'insufficient_data', samples: conversions.length };
    }
    
    // Analyze conversion factors
    const sales = conversions.filter(c => c.outcome === 'sale');
    const noSales = conversions.filter(c => c.outcome !== 'sale');
    
    // Average touchpoints to conversion
    const avgTouchpointsToSale = sales.reduce((sum, c) => sum + (c.touchpoints || 0), 0) / sales.length;
    const avgTouchpointsNoSale = noSales.reduce((sum, c) => sum + (c.touchpoints || 0), 0) / noSales.length;
    
    const model = {
      type: 'lead_scoring',
      optimalTouchpoints: Math.round(avgTouchpointsToSale),
      stopTouchpoints: Math.round(avgTouchpointsNoSale * 1.5),
      trainedAt: new Date().toISOString()
    };
    
    return { name: 'lead_scoring', ...model };
  }
  
  // Helper: analyze patterns
  analyzePatterns(features) {
    const converted = features.filter(f => f.converted);
    const notConverted = features.filter(f => !f.converted);
    
    // Average length
    const avgLength = features.reduce((sum, f) => sum + f.length, 0) / features.length;
    
    // Common words in converted
    const wordCounts = {};
    converted.forEach(f => {
      f.subject.toLowerCase().split(' ').forEach(word => {
        if (word.length > 2) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });
    
    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));
    
    return {
      avgLength: Math.round(avgLength),
      topWords: sorted.slice(0, 10).map(w => w.word),
      avoidWords: sorted.slice(-5).map(w => w.word),
      accuracy: converted.length / features.length
    };
  }
  
  // Save trained models
  saveModels(models) {
    const modelFile = path.join(this.modelDir, 'trained_models.json');
    
    let existing = {};
    if (fs.existsSync(modelFile)) {
      existing = JSON.parse(fs.readFileSync(modelFile));
    }
    
    models.forEach(model => {
      existing[model.name] = model;
    });
    
    fs.writeFileSync(modelFile, JSON.stringify(existing, null, 2));
    console.log('💾 Models saved');
  }
  
  // Load trained models
  loadModels() {
    const modelFile = path.join(this.modelDir, 'trained_models.json');
    
    if (!fs.existsSync(modelFile)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(modelFile));
  }
  
  // Get model for inference
  getModel(name) {
    const models = this.loadModels();
    return models ? models[name] : null;
  }
  
  // A/B test runner
  async runABTest(testId, variantA, variantB) {
    const test = {
      id: testId,
      variantA,
      variantB,
      started: new Date().toISOString(),
      results: { a: 0, b: 0, aConversions: 0, bConversions: 0 }
    };
    
    // Save test
    const testFile = path.join(this.modelDir, 'ab_tests.json');
    let tests = {};
    if (fs.existsSync(testFile)) {
      tests = JSON.parse(fs.readFileSync(testFile));
    }
    tests[testId] = test;
    fs.writeFileSync(testFile, JSON.stringify(tests, null, 2));
    
    return { testId, status: 'running', variantA, variantB };
  }
  
  // Record A/B test result
  recordABResult(testId, variant, converted) {
    const testFile = path.join(this.modelDir, 'ab_tests.json');
    if (!fs.existsSync(testFile)) return;
    
    const tests = JSON.parse(fs.readFileSync(testFile));
    if (tests[testId]) {
      tests[testId].results[variant === 'A' ? 'aConversions' : 'bConversions']++;
      tests[testId].results[variant === 'a' ? 'a' : 'b']++;
      
      fs.writeFileSync(testFile, JSON.stringify(tests, null, 2));
    }
  }
}

module.exports = { TrainingPipeline };
