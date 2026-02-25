/**
 * SELF-LEARNING ENGINE
 * Tracks all metrics and continuously improves
 */

const fs = require('fs');
const path = require('path');
const { AICore } = require('./ai-core');

class LearningEngine {
  constructor() {
    this.ai = new AICore();
    this.ai.init();
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDir();
    
    // Learning parameters
    this.learningRate = 0.1;
    this.weights = {
      subjectLine: 0.3,
      sendTime: 0.2,
      offerPrice: 0.25,
      contentQuality: 0.25
    };
  }
  
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }
  
  // ==================== TRACKING ====================
  
  // Track email performance
  async trackEmail(emailId, leadId, subject, sentAt, opened, clicked, replied, converted) {
    const metrics = this.loadMetrics('email_performance');
    
    metrics.push({
      emailId,
      leadId,
      subject,
      sentAt,
      opened: opened || false,
      clicked: clicked || false,
      replied: replied || false,
      converted: converted || false,
      timestamp: new Date().toISOString()
    });
    
    // Keep last 10000
    if (metrics.length > 10000) {
      metrics.splice(0, metrics.length - 10000);
    }
    
    this.saveMetrics('email_performance', metrics);
    
    // Update learned weights
    await this.updateWeights();
    
    return { tracked: true };
  }
  
  // Track conversion data
  async trackConversion(leadId, touchpoints, finalOutcome, revenue) {
    const conversions = this.loadMetrics('conversions');
    
    conversions.push({
      leadId,
      touchpoints,
      outcome: finalOutcome, // 'sale', 'no_response', 'not_interested'
      revenue: revenue || 0,
      timestamp: new Date().toISOString()
    });
    
    if (conversions.length > 5000) {
      conversions.splice(0, conversions.length - 5000);
    }
    
    this.saveMetrics('conversions', conversions);
    
    return { tracked: true };
  }
  
  // Track pricing sensitivity
  async trackPricing(pricePoint, outcome) {
    const pricing = this.loadMetrics('pricing');
    
    pricing.push({
      price: pricePoint,
      outcome, // 'accepted', 'rejected', 'countered'
      timestamp: new Date().toISOString()
    });
    
    if (pricing.length > 2000) {
      pricing.splice(0, pricing.length - 2000);
    }
    
    this.saveMetrics('pricing', pricing);
  }
  
  // Track content performance
  async trackContent(contentId, type, views, engagement, conversions) {
    const content = this.loadMetrics('content_performance');
    
    content.push({
      contentId,
      type,
      views: views || 0,
      engagement: engagement || 0,
      conversions: conversions || 0,
      timestamp: new Date().toISOString()
    });
    
    if (content.length > 5000) {
      content.splice(0, content.length - 5000);
    }
    
    this.saveMetrics('content_performance', content);
  }
  
  // ==================== LEARNING ====================
  
  // Update weights based on performance
  async updateWeights() {
    const emailPerf = this.loadMetrics('email_performance');
    
    if (emailPerf.length < 50) return; // Need minimum data
    
    // Analyze which factors lead to conversion
    const converted = emailPerf.filter(e => e.converted);
    const notConverted = emailPerf.filter(e => !e.converted);
    
    if (converted.length < 5) return;
    
    // Calculate conversion rates by subject line patterns
    const subjects = {};
    emailPerf.forEach(e => {
      const firstWord = e.subject.split(' ')[0].toLowerCase();
      if (!subjects[firstWord]) subjects[firstWord] = { total: 0, converted: 0 };
      subjects[firstWord].total++;
      if (e.converted) subjects[firstWord].converted++;
    });
    
    // Find best performing first words
    let bestSubjectWord = 'Quick';
    let bestRate = 0;
    Object.entries(subjects).forEach(([word, stats]) => {
      if (stats.total >= 3) {
        const rate = stats.converted / stats.total;
        if (rate > bestRate) {
          bestRate = rate;
          bestSubjectWord = word;
        }
      }
    });
    
    // Adjust weights
    if (bestRate > 0.3) {
      this.weights.subjectLine = Math.min(0.5, this.weights.subjectLine + this.learningRate);
    }
    
    console.log('📈 Weights updated:', this.weights);
    return this.weights;
  }
  
  // Get optimized subject line using AI + learning
  async getOptimizedSubject(businessType, leadData) {
    const emailPerf = this.loadMetrics('email_performance');
    
    // Get top performing subjects
    const subjects = emailPerf
      .filter(e => e.converted)
      .map(e => e.subject)
      .slice(-50);
    
    if (this.ai.openai && subjects.length > 10) {
      // Use AI to generate optimized subject
      const prompt = `Based on these successful email subjects: ${subjects.join(', ')}
      
      Generate 3 new subject lines for a ${businessType} outreach.
      Make them similar in style but original.
      Return as JSON array of strings.`;
      
      try {
        const response = await this.ai.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8
        });
        
        const subjects = JSON.parse(response.choices[0].message.content);
        return subjects[Math.floor(Math.random() * subjects.length)];
      } catch (e) {
        return this.getBestSubject(businessType);
      }
    }
    
    return this.getBestSubject(businessType);
  }
  
  getBestSubject(businessType) {
    const templates = {
      'seo-audit': ['Quick SEO question', 'SEO improvement idea', 'Saw your site...'],
      'leads': ['Lead generation help?', 'Fresh leads for you', 'Helping with leads'],
      'general': ['Quick question', 'Thought you should know', 'Ideas for you']
    };
    
    const options = templates[businessType] || templates['general'];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // ==================== PREDICTIONS ====================
  
  // Predict conversion probability
  async predictConversion(leadData) {
    const conversions = this.loadMetrics('conversions');
    const emailPerf = this.loadMetrics('email_performance');
    
    // Simple ML: calculate base rate
    const totalLeads = conversions.length;
    if (totalLeads < 10) return { probability: 0.1, confidence: 'low' };
    
    const sales = conversions.filter(c => c.outcome === 'sale').length;
    const baseRate = sales / totalLeads;
    
    // Adjust based on touchpoints
    let probability = baseRate;
    if (leadData.touchpoints) {
      probability = Math.min(0.9, baseRate * (1 + leadData.touchpoints * 0.1));
    }
    
    // AI enhancement
    if (this.ai.openai) {
      const aiAnalysis = await this.ai.analyzeLead(leadData);
      probability = (probability + aiAnalysis.score / 100) / 2;
    }
    
    const confidence = totalLeads > 100 ? 'high' : totalLeads > 50 ? 'medium' : 'low';
    
    return {
      probability: Math.round(probability * 100) / 100,
      confidence,
      baseRate,
      totalDataPoints: totalLeads
    };
  }
  
  // Optimal pricing
  async getOptimalPrice(businessType) {
    const pricing = this.loadMetrics('pricing');
    
    const accepted = pricing.filter(p => p.outcome === 'accepted');
    const rejected = pricing.filter(p => p.outcome === 'rejected');
    
    if (accepted.length < 5) {
      // Default prices
      const defaults = {
        'auditiqs': 99,
        'leadvaults': 97,
        'competeai': 197,
        'contentais': 25,
        'socialpulses': 49
      };
      return defaults[businessType] || 99;
    }
    
    // Find sweet spot
    const acceptedPrices = accepted.map(p => p.price);
    const avgAccepted = acceptedPrices.reduce((a, b) => a + b, 0) / acceptedPrices.length;
    
    return Math.round(avgAccepted);
  }
  
  // ==================== INSIGHTS ====================
  
  // Get comprehensive insights
  async getInsights() {
    const emailPerf = this.loadMetrics('email_performance');
    const conversions = this.loadMetrics('conversions');
    const pricing = this.loadMetrics('pricing');
    const content = this.loadMetrics('content_performance');
    
    // Calculate metrics
    const totalEmails = emailPerf.length;
    const opened = emailPerf.filter(e => e.opened).length;
    const clicked = emailPerf.filter(e => e.clicked).length;
    const converted = emailPerf.filter(e => e.converted).length;
    
    const openRate = totalEmails > 0 ? (opened / totalEmails * 100).toFixed(1) : 0;
    const clickRate = totalEmails > 0 ? (clicked / totalEmails * 100).toFixed(1) : 0;
    const conversionRate = totalEmails > 0 ? (converted / totalEmails * 100).toFixed(1) : 0;
    
    // Revenue
    const totalRevenue = conversions
      .filter(c => c.outcome === 'sale')
      .reduce((sum, c) => sum + (c.revenue || 0), 0);
    
    // AI recommendations
    const recommendations = await this.generateRecommendations({
      openRate, clickRate, conversionRate, totalRevenue, totalEmails
    });
    
    return {
      metrics: {
        emails: { total: totalEmails, openRate, clickRate, conversionRate },
        revenue: { total: totalRevenue, perEmail: totalEmails > 0 ? (totalRevenue / totalEmails).toFixed(2) : 0 },
        leads: { total: conversions.length }
      },
      weights: this.weights,
      recommendations,
      aiStatus: this.ai.openai ? 'active' : 'template_mode'
    };
  }
  
  async generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.openRate < 20) {
      recommendations.push({
        priority: 'high',
        area: 'subject_lines',
        recommendation: 'Open rate is low. Try more personalized subject lines.',
        action: 'Use AI to generate subject lines'
      });
    }
    
    if (metrics.conversionRate < 3) {
      recommendations.push({
        priority: 'high',
        area: 'offer',
        recommendation: 'Conversion rate needs improvement. Consider testing different offers.',
        action: 'A/B test pricing and offers'
      });
    }
    
    if (metrics.totalRevenue < 100 && metrics.totalEmails > 100) {
      recommendations.push({
        priority: 'medium',
        area: 'pricing',
        recommendation: 'Revenue per email is low. Consider upsells or higher-priced services.',
        action: 'Review pricing strategy'
      });
    }
    
    // AI-powered recommendation
    if (this.ai.openai && metrics.totalEmails > 20) {
      recommendations.push({
        priority: 'low',
        area: 'ai_optimization',
        recommendation: 'AI analysis available. Enable AI-generated content for better results.',
        action: 'Set OPENAI_API_KEY'
      });
    }
    
    return recommendations;
  }
  
  // ==================== HELPERS ====================
  
  loadMetrics(name) {
    const file = path.join(this.dataDir, `${name}.json`);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file));
    } catch {
      return [];
    }
  }
  
  saveMetrics(name, data) {
    const file = path.join(this.dataDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

module.exports = { LearningEngine };
