import type { AiContext } from './context';

export async function askAi(context: AiContext): Promise<string> {
  const formData = new FormData();
  formData.append('image', context.blob, 'context.png');
  formData.append('metadata', JSON.stringify(context.metadata));

  const response = await fetch('http://localhost:8000/api/ask', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}
