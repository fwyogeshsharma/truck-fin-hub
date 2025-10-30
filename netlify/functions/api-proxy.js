// Netlify Function to proxy API requests to backend
const BACKEND_URL = 'http://34.127.125.215:4000';

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  // Extract the API path from the request
  const path = event.path.replace('/.netlify/functions/api-proxy', '');
  const url = `${BACKEND_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

  console.log(`Proxying ${event.httpMethod} ${url}`);

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Forward the request to the backend using native fetch (Node 18+)
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: headers,
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body
        ? event.body
        : undefined,
    });

    // Get response body
    const data = await response.text();

    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to proxy request',
        message: error.message,
      }),
    };
  }
};
