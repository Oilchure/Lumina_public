import { ExportData } from '../types.ts';

/**
 * --- FINAL IMPLEMENTATION ---
 * 
 * This file now points to the real Netlify Functions endpoint.
 * The rewrite rule in `netlify.toml` will direct any request to `/api/data`
 * to the `netlify/functions/data.ts` serverless function.
 */
const DATA_ENDPOINT_URL = '/api/data';

/**
 * Fetches all application data from the Netlify serverless function.
 * 
 * @returns {Promise<ExportData>} A promise that resolves with all the application data.
 */
export const fetchDataFromServer = async (): Promise<ExportData> => {
  console.log("Fetching data from real API endpoint...");
  
  const response = await fetch(DATA_ENDPOINT_URL);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch data from server: ${response.status} ${errorText}`);
    throw new Error(`数据同步失败: ${errorText || '服务器错误'}`);
  }
  
  const data: ExportData = await response.json();
  console.log('Successfully fetched data from API.');
  return data;
};


/**
 * Saves the entire application data state to the Netlify serverless function.
 * 
 * @param {ExportData} data The complete data object to be saved.
 * @returns {Promise<void>} A promise that resolves when the data is successfully saved.
 */
export const saveDataToServer = async (data: ExportData): Promise<void> => {
  console.log('Saving data to real API endpoint...', data);

  const response = await fetch(DATA_ENDPOINT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to save data to server: ${response.status} ${errorText}`);
    throw new Error(`数据保存失败: ${errorText || '服务器错误'}`);
  }
  
  console.log('Successfully saved data via API.');
};
