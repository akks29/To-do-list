import { Task } from './contexts/TaskContext';

const PERPLEXITY_API_URL = '/api/perplexity';

export interface TaskWithPriority extends Task {
  aiPriority?: number;
  aiReason?: string;
}

export interface PrioritizationRequest {
  tasks: Task[];
  energyLevel: number;
  availableTime: number;
  userPreferences?: string;
}

export interface PrioritizationResponse {
  prioritizedTasks: TaskWithPriority[];
  recommendations: string[];
}

export class AIService {
  static async prioritizeTasks(request: PrioritizationRequest): Promise<PrioritizationResponse> {
    try {
      const prompt = this.buildPrioritizationPrompt(request);
      
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity expert and task prioritization specialist. Help users prioritize their tasks based on their energy level, available time, and task characteristics.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      return this.parseAIResponse(request.tasks, aiResponse);
    } catch (error) {
      console.error('AI prioritization failed:', error);
      // Fallback to basic prioritization
      return this.fallbackPrioritization(request);
    }
  }

  private static buildPrioritizationPrompt(request: PrioritizationRequest): string {
    const tasksJson = JSON.stringify(request.tasks, null, 2);
    
    return `Please help me prioritize my tasks for today. Here are the details:

Energy Level: ${request.energyLevel}/10
Available Time: ${request.availableTime} minutes

Tasks:
${tasksJson}

User Preferences: ${request.userPreferences || 'None specified'}

Please provide:
1. A prioritized list of tasks with priority scores (1-10, where 10 is highest priority)
2. Brief reasoning for each priority score
3. 2-3 specific recommendations for today's planning

Respond in this exact JSON format:
{
  "prioritizedTasks": [
    {
      "id": "task_id",
      "priority": 8,
      "reason": "High impact, matches current energy level"
    }
  ],
  "recommendations": [
    "Start with high-energy tasks in the morning",
    "Group similar tasks together"
  ]
}`;
  }

  private static parseAIResponse(tasks: Task[], aiResponse: string): PrioritizationResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const prioritizedTasks: TaskWithPriority[] = tasks.map(task => {
        const aiTask = parsed.prioritizedTasks?.find((t: any) => t.id === task.id);
        return {
          ...task,
          aiPriority: aiTask?.priority || 5,
          aiReason: aiTask?.reason || 'No AI reasoning provided'
        };
      });

      // Sort by AI priority (highest first)
      prioritizedTasks.sort((a, b) => (b.aiPriority || 0) - (a.aiPriority || 0));

      return {
        prioritizedTasks,
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
  }

  private static fallbackPrioritization(request: PrioritizationRequest): PrioritizationResponse {
    const { tasks, energyLevel } = request;
    
    const prioritizedTasks: TaskWithPriority[] = tasks.map(task => {
      let priority = 5;
      let reason = '';

      // Basic priority logic
      if (task.priority === 'high') priority += 2;
      if (task.priority === 'low') priority -= 1;
      if (task.category === 'urgent') priority += 2;
      
      // Energy-based adjustments
      if (energyLevel >= 7 && task.estimatedTime > 60) priority += 1;
      if (energyLevel <= 3 && task.estimatedTime > 60) priority -= 1;

      if (task.priority === 'high') reason = 'High priority task';
      else if (task.category === 'urgent') reason = 'Urgent category';
      else reason = 'Standard priority';

      return {
        ...task,
        aiPriority: priority,
        aiReason: reason
      };
    });

    prioritizedTasks.sort((a, b) => (b.aiPriority || 0) - (a.aiPriority || 0));

    return {
      prioritizedTasks,
      recommendations: [
        'Focus on high-priority tasks first',
        'Match task complexity to your energy level',
        'Take breaks between intensive tasks'
      ]
    };
  }

  static async getTaskSuggestions(taskTitle: string, category: string): Promise<string[]> {
    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity expert. Provide 3-5 specific, actionable suggestions for improving task execution.'
            },
            {
              role: 'user',
              content: `I have a ${category} task titled "${taskTitle}". Give me 3-5 specific suggestions to make this task more manageable and effective. Keep each suggestion under 100 characters.`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.choices[0]?.message?.content;
      
      if (!suggestions) {
        return ['Break it into smaller steps', 'Set a specific deadline', 'Find an accountability partner'];
      }

      // Parse suggestions from the response
      const lines = suggestions.split('\n').filter((line: string) => line.trim().length > 0);
      return lines.slice(0, 5).map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
    } catch (error) {
      console.error('Failed to get task suggestions:', error);
      return ['Break it into smaller steps', 'Set a specific deadline', 'Find an accountability partner'];
    }
  }
}


