import type { LLMMessage } from '@/types/types';

const APP_ID = import.meta.env.VITE_APP_ID;
const LLM_API_URL = 'add the url';

interface StreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function callLLMStreaming(
  messages: LLMMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': APP_ID
    },
    body: JSON.stringify({
      contents: messages
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr.trim() === '[DONE]') continue;

          try {
            const data: StreamChunk = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              onChunk(text);
            }
          } catch (e) {
            // Skip invalid JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

async function callLLM(messages: LLMMessage[]): Promise<string> {
  let result = '';
  await callLLMStreaming(messages, (chunk) => {
    result += chunk;
  });
  return result;
}

// Parse natural language RFP input to structured data
export async function parseRFPFromNaturalLanguage(input: string): Promise<{
  title: string;
  description: string;
  budget: number | null;
  delivery_timeline: string | null;
  requirements: Record<string, unknown>;
}> {
  const messages: LLMMessage[] = [
    {
      role: 'user',
      parts: [{
        text: `You are an AI assistant that converts natural language procurement requirements into structured RFP data.

Parse the following procurement request and extract structured information. Return ONLY a valid JSON object with these fields:
- title: A concise title for the RFP (string)
- description: A detailed description (string)
- budget: Total budget amount as a number (or null if not specified)
- delivery_timeline: Delivery requirements as a string (or null if not specified)
- requirements: An object containing all specific requirements (items, quantities, specifications, terms, etc.)

Input: "${input}"

Return only the JSON object, no additional text or markdown formatting.`
      }]
    }
  ];

  const response = await callLLM(messages);
  
  // Clean up response to extract JSON
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Parse supplier proposal email to structured data
export async function parseProposalEmail(emailContent: string, rfpContext: string): Promise<{
  content: string;
  pricing: Record<string, unknown>;
  terms: string;
}> {
  const messages: LLMMessage[] = [
    {
      role: 'user',
      parts: [{
        text: `You are an AI assistant that extracts structured information from supplier proposal emails.

RFP Context:
${rfpContext}

Supplier Email:
${emailContent}

Extract the following information and return ONLY a valid JSON object:
- content: A summary of the proposal (string)
- pricing: An object containing all pricing information (line items, totals, discounts, etc.)
- terms: Payment terms, warranty, and other conditions (string)

Return only the JSON object, no additional text or markdown formatting.`
      }]
    }
  ];

  const response = await callLLM(messages);
  
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Evaluate and compare proposals
export async function evaluateProposals(
  rfpContext: string,
  proposals: Array<{
    supplier_name: string;
    content: string;
    pricing: Record<string, unknown>;
    terms: string;
  }>,
  onChunk?: (text: string) => void
): Promise<string> {
  const proposalsText = proposals.map((p, i) => 
    `Proposal ${i + 1} (${p.supplier_name}):
Content: ${p.content}
Pricing: ${JSON.stringify(p.pricing, null, 2)}
Terms: ${p.terms}
`
  ).join('\n---\n');

  const messages: LLMMessage[] = [
    {
      role: 'user',
      parts: [{
        text: `You are an AI procurement assistant that evaluates and compares supplier proposals.

RFP Requirements:
${rfpContext}

Proposals to Compare:
${proposalsText}

Provide a comprehensive evaluation including:
1. Summary of each proposal's strengths and weaknesses
2. Comparison of pricing (value for money)
3. Comparison of terms and conditions
4. Completeness of response to requirements
5. Overall recommendation with reasoning

Format your response in clear sections with markdown formatting.`
      }]
    }
  ];

  if (onChunk) {
    return await callLLMStreaming(messages, onChunk);
  }
  return await callLLM(messages);
}

// Score a single proposal
export async function scoreProposal(
  rfpContext: string,
  proposalContent: string,
  pricing: Record<string, unknown>,
  terms: string
): Promise<{
  score: number;
  summary: string;
  evaluation: Record<string, unknown>;
}> {
  const messages: LLMMessage[] = [
    {
      role: 'user',
      parts: [{
        text: `You are an AI procurement assistant that scores supplier proposals.

RFP Requirements:
${rfpContext}

Proposal Details:
Content: ${proposalContent}
Pricing: ${JSON.stringify(pricing, null, 2)}
Terms: ${terms}

Evaluate this proposal and return ONLY a valid JSON object with:
- score: A number from 0-100 representing overall quality
- summary: A brief 2-3 sentence summary of the proposal
- evaluation: An object with detailed scores for: pricing_competitiveness, terms_favorability, completeness, and overall_fit

Return only the JSON object, no additional text or markdown formatting.`
      }]
    }
  ];

  const response = await callLLM(messages);
  
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}
