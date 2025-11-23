
const JULES_API_ENDPOINT = 'https://jules.googleapis.com/v1alpha';

const getApiKey = () => {
  const apiKey = process.env.JULES_API_KEY;
  if (!apiKey) {
    throw new Error('JULES_API_KEY environment variable not set.');
  }
  return apiKey;
};

const fetchJules = async (path: string, options: RequestInit = {}) => {
  const apiKey = getApiKey();
  const response = await fetch(`${JULES_API_ENDPOINT}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Jules API error: ${error.message}`);
  }

  return response.json();
};

export const listSources = () => {
  return fetchJules('sources');
};

export const createSession = (prompt: string, source: string) => {
  return fetchJules('sessions', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      sourceContext: {
        source,
        githubRepoContext: {
          startingBranch: 'main',
        },
      },
      automationMode: 'AUTO_CREATE_PR',
      title: prompt,
    }),
  });
};

export const getSession = (sessionId: string) => {
  return fetchJules(`sessions/${sessionId}`);
};

export const listActivities = (sessionId: string) => {
    return fetchJules(`sessions/${sessionId}/activities`);
};
