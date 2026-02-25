/**
 * AI CORE - OpenAI Integration
 * Handles all AI operations: content, analysis, predictions
 */

const OpenAI = require('openai');

class AICore {
  constructor() {
    this.openai = null;
    this.model = 'gpt-4';
  }
  
  init() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }
  
  // Generate personalized outreach emails
  async generateOutreach_email(lead, businessType) {
    if (!this.openai) return this.getTemplate_email(lead, businessType);
    
    const prompt = `Generate a personalized cold outreach email for a ${lead.industry} company called "${lead.company}". 
    Contact person: ${lead.firstName} ${lead.lastName}
    Business type: ${businessType}
    
    Write a short, personalized email that:
    - Has a compelling subject line
    - Is不超过100 words
    - Focuses on value for their business
    - Ends with a clear call to action
    
    Return as JSON: {subject, body}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.log('AI generation failed, using template:', e.message);
      return this.getTemplate_email(lead, businessType);
    }
  }
  
  // Generate SEO audit report with AI
  async generateAuditReport(auditData, website) {
    if (!this.openai) return this.getBasicReport(auditData);
    
    const prompt = `You are an expert SEO analyst. Based on this audit data for ${website}:
    
    ${JSON.stringify(auditData)}
    
    Generate a comprehensive SEO report that:
    - Gives a score out of 100
    - Lists top 5 issues with severity
    - Provides actionable recommendations
    - Includes competitive analysis
    - Adds industry-specific tips
    
    Return as detailed HTML report with styling.`;
    
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
  
  // Generate content with AI
  async generateContent(type, topic, requirements) {
    if (!this.openai) return this.getBasicContent(type, topic);
    
    const prompts = {
      'blog-post': `Write a complete blog post about "${topic}". 
      Requirements: ${requirements || 'SEO-optimized, engaging, 1000 words'}
      Include: Introduction, 3-5 main points with headers, conclusion
      Tone: Professional but conversational`,
      
      'social-post': `Create a social media post about "${topic}".
      Platform: Twitter/X
      Length: Under 280 characters
      Include: Emoji, call to action, relevant hashtags`,
      
      'email': `Write a professional cold email about "${topic}".
      Purpose: ${requirements || 'Generate leads'}
      Length: Short (under 150 words)
      Include: Hook, value proposition, call to action`
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
  
  // Analyze lead quality and predict conversion
  async analyzeLead(leadData) {
    if (!this.openai) return { score: 50, confidence: 'low' };
    
    const prompt = `Analyze this lead and predict conversion probability:
    
    ${JSON.stringify(leadData)}
    
    Consider:
    - Company size and industry
    - Email domain quality
    - Online presence indicators
    
    Return JSON: {score: 0-100, confidence: low/medium/high, reasons: [], recommendations: []}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return { score: 50, confidence: 'low', error: e.message };
    }
  }
  
  // Generate response to customer inquiry
  async generateResponse(inquiry, context) {
    if (!this.openai) return this.getTemplateResponse(inquiry);
    
    const prompt = `A customer sent this inquiry: "${inquiry}"
    
    Context: ${context}
    
    Write a helpful, professional response that:
    - Addresses their question
    - Adds value
    - Moves toward sale
    - Sounds human, not robotic
    
    Keep it short and focused.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      });
      
      return response.choices[0].message.content;
    } catch (e) {
      return this.getTemplateResponse(inquiry);
    }
  }
  
  // Fallback templates
  getTemplate_email(lead, businessType) {
    const subjects = [
      `Quick question about ${lead.company}`,
      `Helping ${lead.company} with ${businessType}`,
      `${lead.firstName}, thoughts on this?`
    ];
    
    const bodies = [
      `Hi ${lead.firstName},

I help companies like ${lead.company} improve their ${businessType}.

Would a 5-minute call help?

Best`,
      `Hi ${lead.firstName},

Not sure if you're the right person, but I thought this might interest you.

We help businesses in ${lead.industry} get better results with ${businessType}.

Interested?

Best`
    ];
    
    return {
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      body: bodies[Math.floor(Math.random() * bodies.length)]
    };
  }
  
  getBasicReport(auditData) {
    return `<h1>SEO Audit Report</h1><p>Score: ${auditData.score}/100</p>`;
  }
  
  getBasicContent(type, topic) {
    return `Blog post about ${topic}`;
  }
  
  getTemplateResponse(inquiry) {
    return `Thank you for your interest! I'd be happy to help. Can you tell me more about what you're looking for?`;
  }
}

module.exports = { AICore };
