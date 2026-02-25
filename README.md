# 🤖 AI-POWERED AUTONOMOUS BUSINESS v2.0

Fully autonomous business with **DeepSeek AI** and self-learning capabilities.

## 🧠 AI Provider: DeepSeek

DeepSeek is a powerful open-source AI model - cheaper and often faster than GPT-4!

| Feature | DeepSeek | OpenAI (fallback) |
|---------|----------|-------------------|
| Content Generation | ✅ | ✅ |
| Lead Analysis | ✅ | ✅ |
| Code Generation | ✅ | ✅ |
| Reasoning | ✅ | ✅ |
| Cost | ~$0.14/1M tokens | ~$30/1M tokens |

## What's Included

### 🧠 AI Core (DeepSeek)
- **Content Generation**: AI writes blog posts, emails, social content
- **Lead Analysis**: AI scores and qualifies leads
- **Report Generation**: AI creates comprehensive SEO reports
- **Response Generation**: AI replies to customer inquiries
- **Code Generation**: AI can write code too!

### 📊 Self-Learning Engine
- Tracks all metrics: opens, clicks, conversions, revenue
- Continuously optimizes subject lines, pricing, content
- Learns from every interaction
- Updates weights automatically

### 🔮 Predictive Analytics
- **CLV Prediction**: Predicts customer lifetime value
- **Churn Detection**: Identifies at-risk customers
- **Best Send Time**: AI recommends optimal send times
- **Next Best Action**: Recommends what to do next

### 🎓 Training Pipeline
- Automatic model training every 24 hours
- A/B test runner
- Pattern recognition
- Model versioning

## Quick Start

```bash
# Install
npm install openai stripe resend

# Set environment (DeepSeek)
export DEEPSEEK_API_KEY=sk-...

# Or fallback to OpenAI
export OPENAI_API_KEY=sk-...

# Set payment/email
export STRIPE_SECRET_KEY=sk_live_...
export RESEND_API_KEY=re_...

# Run
node index.js
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DEEPSEEK_API_KEY | Yes* | DeepSeek API key (get from deepseek.com) |
| OPENAI_API_KEY | Yes* | Fallback if no DeepSeek key |
| STRIPE_SECRET_KEY | Yes | Payment processing |
| RESEND_API_KEY | Yes | Email sending |
| STRIPE_WEBHOOK_SECRET | Yes | Payment webhooks |

*At least one AI provider required

## Get DeepSeek API Key

1. Go to https://platform.deepseek.com
2. Sign up / Login
3. Create API key
4. Start using!

## Features

### Automated Operations
- Daily AI-powered outreach
- Auto-generate leads
- Auto-deliver services
- Auto-respond to customers

### Self-Improving
- Tracks performance
- Identifies patterns
- Optimizes strategies
- Trains nightly

### Analytics Dashboard
- Real-time metrics
- AI insights
- Predictions
- Recommendations

## Files

```
ai-biz/
├── index.js              # Main entry
├── ml/
│   ├── ai-core.js       # DeepSeek/OpenAI integration
│   └── learning-engine.js # Self-learning
├── predictive/
│   └── index.js         # Predictions
├── training/
│   └── index.js         # ML training
└── data/                # Learning data
```

---

Built with 🧠 DeepSeek for fully autonomous AI-powered revenue
