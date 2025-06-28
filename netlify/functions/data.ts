import type { Handler, HandlerEvent } from "@netlify/functions";
import { getDeployStore } from "@netlify/blobs";
import { ExportData, Word, KnowledgePoint, Category, Task } from '../../src/types';

// 这是您数据在Netlify Blobs中的名字，可以保持不变
const STORE_NAME = "lumina-data-store";
const BLOB_KEY = "main-data";


const handler: Handler = async (event: HandlerEvent) => {
  const store = getDeployStore({ siteID: 0a3af35d-d281-4909-b94c-c4eba048987f, name: lumina-data-store });

  const headers = {
    'Access-Control-Allow-Origin': '*', // 允许所有来源的请求
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // 浏览器在发送POST请求前会先发送一个OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
    };
  }

  try {
    if (event.httpMethod === "GET") {
      console.log("Function invoked: GET /data");
      const data = await store.get(BLOB_KEY, { type: 'json' });

      if (!data) {
         console.log("No data found in blob store, returning empty structure.");
         return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ words: [], knowledgePoints: [], categories: [], tasks: [] }),
          };
      }
      
      console.log("Successfully retrieved data from blob store.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (event.httpMethod === "POST") {
       console.log("Function invoked: POST /data");
      if (!event.body) {
        throw new Error("Request body is missing.");
      }
      
      const dataToSave: ExportData = JSON.parse(event.body);

      // 简单的验证，确保核心数据数组存在
      if (!dataToSave.words || !dataToSave.knowledgePoints || !dataToSave.categories || !dataToSave.tasks) {
          throw new Error("Invalid data structure received.");
      }
      
      await store.setJSON(BLOB_KEY, dataToSave);
      console.log("Successfully saved data to blob store.");

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Data saved successfully" }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };

  } catch (error) {
    console.error("Error in serverless function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
    };
  }
};

export { handler };
