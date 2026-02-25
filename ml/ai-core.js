/**
 * AI CORE - MULTI-PROVIDER SUPPORT
 * Supports: DeepSeek (free tier), Ollama (local free), Templates (fallback)
 */

const OpenAI = require('openai');

class AICore {
  constructor() {
    this.openai = null;
    this.ollama = null;
    this.provider = null;
    this.model = 'deepseek-chat';
    this.localModel = 'llama3'; // or 'deepseek-coder', 'mistral'
  }
  
  init() {
    // Priority 1: DeepSeek API (has free tier)
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: 'https://api.deepseek.com/v1'
        });
        this.provider = 'deepseek';
        this.model = 'deepseek-chat';
        console.log('🧠 AI: DeepSeek API (free tier)');
        return;
      } catch (e) {
        console.log('DeepSeek failed, trying next option...');
      }
    }
    
    // Priority 2: OpenAI (if provided)
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.provider = 'openai';
        this.model = 'gpt-4';
        console.log('🧠 AI: OpenAI (fallback)');
        return;
      } catch (e) {
        console.log('OpenAI failed, trying next option...');
      }
    }
    
    // Priority 3: Ollama (LOCAL - FREE!)
    this.checkOllama();
  }
  
  // Check if Ollama is running locally
  async checkOllama() {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        this.ollama = true;
        this.provider = 'ollama';
        console.log('🧠 AI: Ollama (local - FREE!)');
        
        // Pull model if needed
        await this.ensureModel();
        return;
      }
    } catch (e) {
      // Ollama not running
    }
    
    // Fallback: Use templates
    this.provider = 'template';
    console.log('🧠 AI: Template mode (no API needed)');
  }
  
  async ensureModel() {
    try {
      // Check if model exists
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      const hasModel = data.models?.some(m => m.name === this.localModel);
      
      if (!hasModel) {
        console.log(`📥 Pulling ${this.localModel} model (first time - may take a few minutes)...`);
        // Model will be pulled on first use
      }
    } catch (e) {
      console.log('Could not check Ollama models');
    }
  }
  
  isAvailable() {
    return !!(this.openai || this.ollama);
  }
  
  getProvider() {
    return this.provider;
  }
  
  getStatus() {
    return {
      provider: this.provider,
      model: this.model,
      isFree: this.provider === 'ollama' || this.provider === 'template',
      cost: this.provider === 'ollama' ? '$0 (local)' : 
            this.provider === 'deepseek' ? '$0.14/1M tokens (free tier)' :
            this.provider === 'openai' ? '$30/1M tokens' : 'N/A'
    };
  }

  // Generate personalized outreach emails
  async generateOutreach_email(lead, businessType) {
    if (this.provider === 'template') return this.getTemplate_email(lead, businessType);
    
    if (this.provider === 'ollama') return await this.ollamaGenerate('outreach', { lead, businessType });
    
    if (!this.openai) return this.getTemplate_email(lead, businessType);
    
    const prompt = `Generate a personalized cold outreach email for a ${lead.industry} company called "${lead.company}". 
    Contact: ${lead.firstName} ${lead.lastName}
    Business: ${businessType}
    
    Write under 100 words. Focus on value. Include subject line.
    Return JSON: {subject, body}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.log('AI generation failed:', e.message);
      return this.getTemplate_email(lead, businessType);
    }
  }
  
  // Generate SEO audit report
  async generateAuditReport(auditData, website) {
    if (this.provider === 'template') return this.getBasicReport(auditData);
    
    if (this.provider === 'ollama') return await this.ollamaGenerate('audit', { auditData, website });
    
    if (!this.openai) return this.getBasicReport(auditData);
    
    const prompt = `Create SEO report for ${website}:
    Score: ${auditData.score || 0}/100
    
    Include: Issues, Recommendations, Action plan. HTML format.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });
      return response.choices[0].message.content;
    } catch (e) {
      return this.getBasicReport(auditData);
    }
  }
  
  // Generate content
  async generateContent(type, topic, requirements) {
    if (this.provider === 'template') return this.getBasicContent(type, topic);
    
    if (this.provider === 'ollama') return await this.ollamaGenerate('content', { type, topic });
    
    if (!this.openai) return this.getBasicContent(type, topic);
    
    const prompts = {
      'blog-post': `Write blog post about "${topic}". 1000 words, SEO-optimized.`,
      'social-post': `Tweet about "${topic}". Under 280 chars with hashtags.`,
      'email': `Cold email about "${topic}". Professional, under 150 words.`
    };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompts[type] || prompts['blog-post'] }],
        temperature: 0.7
      });
      return response.choices[0].message.content;
    } catch (e) {
      return this.getBasicContent(type, topic);
    }
  }
  
  // Analyze lead
  async analyzeLead(leadData) {
    if (this.provider === 'template') return { score: 50, confidence: 'low' };
    
    if (this.provider === 'ollama') {
      const result = await this.ollamaGenerate('analyze', { leadData });
      return result || { score: 50, confidence: 'low' };
    }
    
    if (!this.openai) return { score: 50, confidence: 'low' };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: `Analyze lead: ${JSON.stringify(leadData)}. Return JSON: {score: 0-100, confidence, reasons: []}` }],
        response_format: { type: "json_object" }
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return { score: 50, confidence: 'low' };
    }
  }
  
  // Generate response to customer
  async generateResponse(inquiry, context) {
    if (this.provider === 'template') return this.getTemplateResponse(inquiry);
    
    if (this.provider === 'ollama') {
      return await this.ollamaGenerate('respond', { inquiry, context }) || this.getTemplateResponse(inquiry);
    }
    
    if (!this.openai) return this.getTemplateResponse(inquiry);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: `Reply to: "${inquiry}" (Context: ${context})` }],
        temperature: 0.5
      });
      return response.choices[0].message.content;
    } catch (e) {
      return this.getTemplateResponse(inquiry);
    }
  }
  
  // Ollama local generation
  async ollamaGenerate(task, data) {
    if (!this.ollama) return null;
    
    let prompt = '';
    
    switch(task) {
      case 'outreach':
        prompt = `Generate outreach email for ${data.lead.company}. Return JSON: {subject, body}`;
        break;
      case 'audit':
        prompt = `Create SEO report for ${data.website}. HTML format.`;
        break;
      case 'content':
        prompt = `Write about: ${data.topic}`;
        break;
      case 'analyze':
        prompt = `Analyze lead: ${JSON.stringify(data.leadData)}. Return JSON: {score: 0-100, confidence}`;
        break;
      case 'respond':
        prompt = `Reply: ${data.inquiry}`;
        break;
    }
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.localModel,
          prompt,
          stream: false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.response;
      }
    } catch (e) {
      console.log('Ollama error:', e.message);
    }
    
    return null;
  }
  
  // Fallback templates
  getTemplate_email(lead, businessType) {
    const subjects = [`Question for ${lead.company}`, `Helping ${lead.company}`, `${lead.firstName}, quick question`];
    const bodies = [
      `Hi ${lead.firstName},\n\nI help companies like ${lead.company} with ${businessType}. Would a call help?\n\nBest`,
      `Hi ${lead.firstName},\n\nNot sure if you're the right person, but thought you might benefit from our ${businessType} services.\n\nBest`
    ];
    return {
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      body: bodies[Math.floor(Math.random() * bodies.length)]
    };
  }
  
  getBasicReport(auditData) {
    return `<h1>SEO Audit Report</h1><p>Score: ${auditData.score || 0}/100</p><p>Report generated.</p>`;
  }
  
  getBasicContent(type, topic) {
    return `Content about ${topic}`;
  }
  
  getTemplateResponse(inquiry) {
    return `Thank you for reaching out! I'd be happy to help. Could you tell me more about what you're looking for?`;
  }
}

module.exports = { AICore };
