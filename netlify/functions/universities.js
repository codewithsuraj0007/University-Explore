// netlify/functions/universities.js

const axios = require("axios");

exports.handler = async (event) => {
  try {
    const country = event.queryStringParameters.country;

    if (!country) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Country parameter is required" }),
      };
    }

    const response = await axios.get(
      "http://universities.hipolabs.com/search",
      {
        params: { country },
        timeout: 10000, // VERY IMPORTANT
      }
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Function error:", error.message);

    return {
      statusCode: 200, // ← DO NOT return 500
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify([]), // graceful fallback
    };
  }
};
