export const ALLOWED_SALES_STATUSES = [
  'Converted',
  'Interested',
  'Follow-up Required',
  'Not Interested',
  'Demo Requested',
  'No Response'
];

export async function generateCallSummaryAndClassification(transcript = []) {
  // If transcript is empty or has fewer than 2 short turns, classify as No Response
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return {
      summary: 'Call initiated but no conversation audio or transcript was recorded.',
      customer_requirements: [],
      objections: [],
      customer_interest: 'Low',
      next_steps: ['Reach out via email or schedule another call'],
      sales_status: 'No Response',
      status_reason: 'No conversation took place or the call was disconnected before speaking.'
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const summaryModel = process.env.OPENAI_SUMMARY_MODEL?.trim() || 'gpt-4o-mini';

  // Format transcript into readable dialogue
  const formattedDialogue = transcript
    .map(t => `${t.speaker}: ${t.text}`)
    .join('\n');

  // If no API key configured, generate an intelligent heuristic fallback
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return generateHeuristicClassification(transcript, formattedDialogue);
  }

  const systemPrompt = `
You are a senior sales conversation analyst. Analyze the following conversation between an AI Sales Assistant representing "SalesFlow AI" and a customer.

You must output a strictly formatted JSON object with EXACTLY these keys:
{
  "summary": "Short 2-3 sentence overview of the conversation",
  "customer_requirements": ["List of customer needs/requirements expressed, or empty array"],
  "objections": ["List of objections raised (e.g., price, timing, complexity), or empty array"],
  "customer_interest": "Low" | "Medium" | "High",
  "next_steps": ["Specific recommended next actions"],
  "sales_status": "One of the 6 allowed values below",
  "status_reason": "Brief evidence-based explanation citing dialogue"
}

### CRITICAL RULES FOR sales_status:
You may ONLY use one of these exact 6 values:
1. "Converted": The customer explicitly confirmed purchasing or subscribing. (Do not guess or assume conversion without explicit agreement).
2. "Interested": The customer demonstrated genuine interest and engaged positively, but has not yet committed to a demo or purchase.
3. "Follow-up Required": The customer asked to be contacted later, or a future follow-up was explicitly agreed upon.
4. "Not Interested": The customer clearly declined, said no, or asked to end the conversation.
5. "Demo Requested": The customer explicitly asked for, accepted, or scheduled a product demo.
6. "No Response": No meaningful customer response was received, customer hung up immediately, or no substantive conversation occurred.

Respond with ONLY valid JSON.
`.trim();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: summaryModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TRANSCRIPT:\n${formattedDialogue}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI summary API error:', errBody);
      throw new Error(`OpenAI Summary API failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    // Validate and sanitize returned fields
    const validatedStatus = ALLOWED_SALES_STATUSES.includes(parsed.sales_status)
      ? parsed.sales_status
      : 'Follow-up Required';

    const interestLevels = ['Low', 'Medium', 'High'];
    const validatedInterest = interestLevels.includes(parsed.customer_interest)
      ? parsed.customer_interest
      : 'Medium';

    return {
      summary: parsed.summary || 'Conversation completed.',
      customer_requirements: Array.isArray(parsed.customer_requirements) ? parsed.customer_requirements : [],
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      customer_interest: validatedInterest,
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : ['Follow up with customer'],
      sales_status: validatedStatus,
      status_reason: parsed.status_reason || 'Determined by dialogue analysis.'
    };
  } catch (err) {
    console.warn('AI summary generation failed, using heuristic fallback:', err.message);
    return generateHeuristicClassification(transcript, formattedDialogue);
  }
}

/**
 * Heuristic fallback when OpenAI API is unreachable or key is not set
 */
function generateHeuristicClassification(transcript, dialogue) {
  const text = dialogue.toLowerCase();

  let sales_status = 'No Response';
  let status_reason = 'Call ended with minimal interaction.';
  let customer_interest = 'Low';
  const customer_requirements = [];
  const objections = [];
  const next_steps = [];

  const customerMessages = transcript.filter(t => t.speaker === 'Customer');

  if (customerMessages.length === 0 || text.length < 30) {
    sales_status = 'No Response';
    status_reason = 'No substantive customer interaction detected during the session.';
    customer_interest = 'Low';
    next_steps.push('Re-engage via automated email or follow-up call');
  } else if (text.includes('demo') || text.includes('trial') || text.includes('show me') || text.includes('see it')) {
    sales_status = 'Demo Requested';
    status_reason = 'Customer asked to see a demo or test the product.';
    customer_interest = 'High';
    next_steps.push('Send calendar link for live product demonstration');
    next_steps.push('Provision 14-day free trial account');
  } else if (text.includes('buy') || text.includes('purchase') || text.includes('sign up') || text.includes('credit card')) {
    sales_status = 'Converted';
    status_reason = 'Customer confirmed purchasing or signing up for SalesFlow AI.';
    customer_interest = 'High';
    next_steps.push('Send welcome onboarding email and account credentials');
  } else if (text.includes('not interested') || text.includes('don\'t need') || text.includes('stop calling') || text.includes('no thanks')) {
    sales_status = 'Not Interested';
    status_reason = 'Customer expressed that they do not need the solution at this time.';
    customer_interest = 'Low';
    next_steps.push('Mark lead as inactive, do not spam');
  } else if (text.includes('call me later') || text.includes('busy') || text.includes('email me') || text.includes('tomorrow') || text.includes('next week')) {
    sales_status = 'Follow-up Required';
    status_reason = 'Customer requested a follow-up at a more convenient time.';
    customer_interest = 'Medium';
    next_steps.push('Send brief recap email and schedule reminder callback');
  } else {
    sales_status = 'Interested';
    status_reason = 'Customer engaged in discovery conversation about their workflow and leads.';
    customer_interest = 'Medium';
    next_steps.push('Send SalesFlow AI feature deck and follow up in 2 days');
  }

  if (text.includes('lead') || text.includes('track') || text.includes('crm')) {
    customer_requirements.push('Centralized lead and pipeline tracking');
  }
  if (text.includes('follow') || text.includes('remind') || text.includes('whatsapp') || text.includes('email')) {
    customer_requirements.push('Automated multi-channel customer follow-up');
  }
  if (text.includes('price') || text.includes('cost') || text.includes('expensive')) {
    objections.push('Cost / budget inquiry');
  }
  if (text.includes('excel') || text.includes('sheet') || text.includes('already use')) {
    objections.push('Currently using spreadsheets or existing manual process');
  }

  const summary = `Voice conversation conducted regarding SalesFlow AI. Customer exchanged ${customerMessages.length} message(s). Status evaluated as ${sales_status}.`;

  return {
    summary,
    customer_requirements: customer_requirements.length > 0 ? customer_requirements : ['Lead organization'],
    objections: objections.length > 0 ? objections : ['No major objections recorded'],
    customer_interest,
    next_steps: next_steps.length > 0 ? next_steps : ['Follow up to answer further questions'],
    sales_status,
    status_reason
  };
}
