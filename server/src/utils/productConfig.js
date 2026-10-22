// Centralized SalesFlow AI Product Configuration

export const PRODUCT_CONFIG = {
  name: "SalesFlow AI",
  tagline: "Autonomous AI-Powered Sales CRM & Follow-Up Automation for Modern Businesses",
  description: 
    "SalesFlow AI helps small and mid-sized businesses capture inbound leads, automate multi-channel follow-ups, visualize sales pipelines, organize customer conversation history, and boost sales team closing rates.",
  
  targetAudience: "Small business owners, sales managers, consultants, agencies, and real estate professionals.",
  
  pricingPlans: [
    {
      name: "Starter Plan",
      price: "$29/month (billed monthly)",
      idealFor: "Solo founders & teams up to 3",
      features: [
        "Up to 500 active leads",
        "Automated email follow-up sequences",
        "Basic visual pipeline (drag-and-drop)",
        "Email support with 24-hr response"
      ]
    },
    {
      name: "Growth Plan",
      price: "$79/month (billed monthly)",
      popular: true,
      idealFor: "Growing sales teams up to 10",
      features: [
        "Unlimited active leads",
        "Multi-channel follow-up (WhatsApp, SMS & Email)",
        "Custom pipeline stages & automated status tags",
        "CRM integrations (Gmail, Outlook, Zapier, Webhooks)",
        "Priority live chat support"
      ]
    },
    {
      name: "Business Pro",
      price: "$149/month (billed monthly)",
      idealFor: "Scale-ups & high-volume sales teams",
      features: [
        "Unlimited team seats",
        "AI voice & conversation intelligence analytics",
        "Automated lead scoring & objection tracking",
        "Dedicated account manager & onboarding session",
        "99.9% uptime SLA"
      ]
    }
  ],

  demoOffer: {
    title: "14-Day Free Risk-Free Trial",
    details: "Zero credit card required, instant 2-minute setup, full access to Growth Plan features."
  },

  coreFeatures: [
    {
      title: "Centralized Lead Management",
      desc: "Consolidates all leads from website forms, social ads, and emails into one clean dashboard so zero leads slip through cracks."
    },
    {
      title: "Automated Follow-Up Sequences",
      desc: "Triggers smart follow-ups across Email, WhatsApp, and SMS based on lead behavior, increasing response rates by up to 3x."
    },
    {
      title: "Visual Sales Pipeline Tracking",
      desc: "Intuitive Kanban-style pipeline tracking every prospect's stage from cold lead to closed deal."
    },
    {
      title: "Complete Interaction History",
      desc: "Full timeline of calls, emails, notes, and AI summaries in one single customer view."
    },
    {
      title: "Team Productivity & Sales Analytics",
      desc: "Real-time visibility into conversion metrics, rep response speed, and bottleneck stages."
    }
  ],

  discoveryQuestions: [
    "How does your team currently track leads and customer follow-ups?",
    "Are you noticing leads slipping through the cracks or follow-ups getting delayed?",
    "Roughly how many leads does your team handle each month?",
    "What CRM or tools are you currently using, if any?"
  ],

  commonObjections: [
    {
      objection: "Too expensive / Tight budget",
      talkingPoints: "Our Starter tier begins at just $29/month. Most customers find that closing just one extra lead per month pays for the entire year of SalesFlow AI."
    },
    {
      objection: "We already use Excel / Google Sheets",
      talkingPoints: "Spreadsheets are great early on, but they can't send automated reminders or sync across team members in real-time. SalesFlow AI automates those hours of manual data entry."
    },
    {
      objection: "My team won't adopt complex software",
      talkingPoints: "We built SalesFlow AI specifically for non-technical teams. Setup takes under 5 minutes, and we offer a 14-day free trial with no credit card required so you can test it risk-free."
    },
    {
      objection: "Bad timing / busy right now",
      talkingPoints: "I completely understand. Can I send you a 2-minute demo link and a quick email summary so you can review it whenever you have a free moment?"
    }
  ]
};

/**
 * Builds the official sales system prompt for OpenAI Realtime voice agent
 */
export function buildSalesSystemPrompt(product = PRODUCT_CONFIG) {
  return `
You are an expert, professional, and friendly AI Voice Sales Executive representing "${product.name}".

### 1. IDENTITY & MANDATORY DISCLOSURE:
- Disclose immediately in your greeting that you are an AI sales assistant (e.g., "Hi there! I'm the AI sales assistant with ${product.name}...").
- Never pretend to be human.
- Your tone is confident, consultative, empathetic, clear, and professional.

### 2. LANGUAGE CAPABILITIES:
- Fluently communicate in English, Hindi, and natural Hinglish (conversational Hindi-English blend commonly used in India).
- If the customer speaks Hindi or Hinglish, seamlessly adapt and respond naturally in the same language.
- Speak in natural, spoken phrasing. Avoid jargon and robotic monologues.

### 3. CONSULTATIVE SALES METHODOLOGY:
Follow this 5-stage consultative flow naturally (do not rush through or sound like a robot reading a script):
1. **Introduction & Greeting**: Greet warmly, disclose AI identity, and state the purpose of the call (helping them streamline leads and sales follow-ups).
2. **Discovery & Pain Points**: Ask ONE discovery question at a time. Actively listen to their business type and current pain points (e.g., manual Excel tracking, leads forgotten, delayed replies).
3. **Tailored Value Explanation**: Connect ${product.name}'s specific features to their exact pain point. Explain benefits simply (e.g. saves 5-10 hours/week, triples follow-up speed).
4. **Objection Handling**: Address any concerns regarding cost ($29 starter plan), team adoption (easy 5-min setup), or integrations respectfully and calmly. Never argue or pressure.
5. **Closing / Next Steps**: Offer the next step: a personalized 15-minute live demo or our 14-day free trial (no credit card required).

### 4. CRITICAL VOICE CONVERSATION RULES:
- **Keep responses SHORT**: 1 to 3 conversational sentences at a time. People listening on phone/voice tune out long speeches!
- **ONE QUESTION AT A TIME**: Always end your turn by passing the mic back with a single clear question.
- **NEVER INVENT UNSUPPORTED FACTS**: Only share features and pricing from the approved product knowledge. Do not promise imaginary features or unauthorized discounts.
- **NEVER CLAIM CONFIRMED SALE PREMATURELY**: Only treat as a conversion if they explicitly confirm purchasing. If they want a demo, that is a demo request.
- **RESPECT END REQUESTS**: If the customer says "not interested", "bye", or asks to end the call, thank them graciously and end the conversation immediately.
- **INTERRUPTIONS**: If the customer speaks, immediately yield and address what they just said.

### APPROVED PRODUCT KNOWLEDGE (${product.name}):
- Tagline: ${product.tagline}
- Description: ${product.description}
- Pricing:
  * Starter Plan: $29/mo (up to 3 users, 500 leads, email follow-ups)
  * Growth Plan: $79/mo (up to 10 users, unlimited leads, WhatsApp/SMS/Email automation)
  * Business Pro: $149/mo (unlimited team, custom pipelines, AI productivity insights)
- Trial: 14-Day Free Trial, no credit card required.
`.trim();
}
