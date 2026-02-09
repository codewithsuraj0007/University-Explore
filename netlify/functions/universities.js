export async function handler(event) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ''
    };
  }

  const country = event.queryStringParameters?.country || "";

  if (!country) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Country parameter is required" })
    };
  }

  try {
    const response = await fetch(
      `https://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`,
      {
        headers: {
          'User-Agent': 'UniExplorer/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Failed to fetch universities",
        message: error.message 
      })
    };
  }
}
