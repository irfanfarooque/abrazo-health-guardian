import { Env } from '@/config/env';
import type { HealthContext, AIAction } from '@/types/ai';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;

  constructor() {
    // Accept key from multiple common sources to avoid runtime misconfiguration
    this.apiKey =
      Env?.deepseekApiKey ||
      (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_DEEPSEEK_API_KEY : undefined) ||
      '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private buildSystemPrompt(healthContext?: HealthContext): string {
    const basePrompt = `You are ABRAZO Health Guardian, a supportive AI health assistant. Your role is to:
- Provide first aid guidance and general health information
- Explain medical readings in simple, non-alarming terms
- Help users book consultations and order medicines
- Analyze health trends and provide insights
- Be supportive, medical-safe, and only alarm when there's real danger

IMPORTANT:
- Never provide medical diagnoses or replace professional medical advice
- Always recommend consulting a healthcare professional for serious concerns
- Use a supportive, empathetic tone
- If you detect critical health issues, recommend immediate medical attention
`;

    if (healthContext) {
      let contextSection = '\nCurrent Health Context:\n';
      
      if (healthContext.latest_metrics) {
        contextSection += '- Latest Metrics:\n';
        if (healthContext.latest_metrics.blood_pressure) {
          const bp = healthContext.latest_metrics.blood_pressure;
          contextSection += `  * Blood Pressure: ${bp.systolic}/${bp.diastolic} mmHg (${bp.recorded_at})\n`;
        }
        if (healthContext.latest_metrics.heart_rate) {
          const hr = healthContext.latest_metrics.heart_rate;
          contextSection += `  * Heart Rate: ${hr.value} ${hr.unit} (${hr.recorded_at})\n`;
        }
        if (healthContext.latest_metrics.spo2) {
          const spo2 = healthContext.latest_metrics.spo2;
          contextSection += `  * SpO₂: ${spo2.value} ${spo2.unit} (${spo2.recorded_at})\n`;
        }
        if (healthContext.latest_metrics.temperature) {
          const temp = healthContext.latest_metrics.temperature;
          contextSection += `  * Temperature: ${temp.value} ${temp.unit} (${temp.recorded_at})\n`;
        }
      }

      if (healthContext.active_alerts && healthContext.active_alerts.length > 0) {
        contextSection += '- Active Alerts:\n';
        healthContext.active_alerts.forEach((alert) => {
          contextSection += `  * [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}\n`;
        });
      }

      if (healthContext.current_medicines && healthContext.current_medicines.length > 0) {
        contextSection += '- Current Medicines:\n';
        healthContext.current_medicines.forEach((med) => {
          contextSection += `  * ${med.name}: ${med.dosage} (${med.frequency})\n`;
        });
      }

      if (healthContext.upcoming_consultations && healthContext.upcoming_consultations.length > 0) {
        contextSection += '- Upcoming Consultations:\n';
        healthContext.upcoming_consultations.forEach((consult) => {
          contextSection += `  * ${consult.doctor_name} on ${consult.date}\n`;
        });
      }

      return basePrompt + contextSection;
    }

    return basePrompt;
  }

  async chat(
    messages: DeepSeekMessage[],
    healthContext?: HealthContext,
  ): Promise<{ content: string; action?: AIAction }> {
    if (!this.isConfigured()) {
      // Non-fatal fallback: return a helpful assistant response so the app doesn't crash
      console.warn('[DeepSeek] API key missing - returning fallback assistant message');
      return {
        content:
          'AI assistant is not configured. Please set your DEEPSEEK API key in environment variables (EXPO_PUBLIC_DEEPSEEK_API_KEY) to enable AI features.',
      };
    }

    const systemPrompt = this.buildSystemPrompt(healthContext);
    const fullMessages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    try {
      // Add a timeout to avoid hanging requests
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = controller
        ? setTimeout(() => controller.abort(), 15000)
        : undefined;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
        // attach signal only when available
        ...(controller ? { signal: controller.signal } : {}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API error: ${response.statusText}`);
      }

      // Parse safely and guard missing fields
      const data = (await response.json().catch(() => ({}))) as Partial<DeepSeekResponse> | any;
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        'I apologize, but I could not generate a response.';

      if (timeout) clearTimeout(timeout);

      // Try to extract action from response
      const action = this.extractAction(content);

      return { content, action };
    } catch (error) {
      // If abort happened, give clearer message
      if ((error as any)?.name === 'AbortError') {
        console.error('[DeepSeek] request aborted / timed out');
        throw new Error('AI request timed out. Check network connectivity.');
      }
      console.error('[DeepSeek] API error:', error);
      throw error instanceof Error ? error : new Error('Failed to communicate with AI assistant');
    }
  }

  private extractAction(content: string): AIAction | undefined {
    // Simple action extraction - can be enhanced with structured output
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('book consultation') || lowerContent.includes('schedule appointment')) {
      return { type: 'book_consultation' };
    }

    if (lowerContent.includes('order medicine') || lowerContent.includes('buy medicine')) {
      return { type: 'order_medicine' };
    }

    if (lowerContent.includes('analyze') && (lowerContent.includes('health') || lowerContent.includes('reading'))) {
      return { type: 'analyze_health' };
    }

    if (lowerContent.includes('first aid') || lowerContent.includes('emergency')) {
      return { type: 'first_aid' };
    }

    return undefined;
  }

  async analyzeHealthTrends(metrics: any[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API key not configured');
    }

    const metricsSummary = metrics
      .slice(0, 20)
      .map((m) => {
        if (m.metric_type === 'blood_pressure') {
          return `BP: ${m.systolic}/${m.diastolic} mmHg on ${m.recorded_at}`;
        }
        return `${m.metric_type}: ${m.value} ${m.unit || ''} on ${m.recorded_at}`;
      })
      .join('\n');

    const messages: DeepSeekMessage[] = [
      {
        role: 'user',
        content: `Analyze these recent health metrics and provide insights:\n\n${metricsSummary}\n\nProvide a brief analysis focusing on trends, any concerns, and recommendations.`,
      },
    ];

    const result = await this.chat(messages);
    return result.content;
  }
}

export const deepSeekClient = new DeepSeekClient();

