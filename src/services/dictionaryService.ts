
import { DICTIONARY_API_URL, API_TIMEOUT_MS, MAX_DEFINITIONS_TO_SAVE, API_POS_TO_CHINESE_MAP } from '../constants.ts';
import { WordDefinition, DictionaryAPIResponse, PartOfSpeechCh } from '../types.ts';

export const fetchWordDefinitions = async (word: string): Promise<WordDefinition[] | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${DICTIONARY_API_URL}${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    
    // Clear timeout regardless of response.ok, as the request itself completed.
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Dictionary API request failed:', response.status, response.statusText);
      // Attempt to parse error if possible
      try {
        const errorData = await response.json();
        console.error('API Error Data:', errorData);
        if (response.status === 404 && errorData?.title === "No Definitions Found") {
            // Specific handling for 404s that mean "no definition" vs "API endpoint not found"
             return []; // Return empty array to signal "found but no definitions"
        }
      } catch (e) {
        // Ignore if error response is not JSON
      }
      return null; // For other errors
    }

    const data: DictionaryAPIResponse = await response.json();
    if (!data || data.length === 0) {
      return []; // Return empty array if API returns success but empty data (means word not found by API)
    }
    
    const apiWordData = data[0];
    const extractedDefinitions: WordDefinition[] = [];

    for (const meaning of apiWordData.meanings) {
      if (extractedDefinitions.length >= MAX_DEFINITIONS_TO_SAVE) break;
      
      const chinesePOS = API_POS_TO_CHINESE_MAP[meaning.partOfSpeech.toLowerCase()] || '其他' as PartOfSpeechCh;

      for (const def of meaning.definitions) {
        if (extractedDefinitions.length >= MAX_DEFINITIONS_TO_SAVE) break;
        
        extractedDefinitions.push({
          partOfSpeech: chinesePOS,
          definition: def.definition,
          example: def.example?.substring(0,200) || undefined,
        });
      }
    }
    return extractedDefinitions.length > 0 ? extractedDefinitions : []; // Return empty if no defs extracted but API call was "ok"

  } catch (error: any) {
    clearTimeout(timeoutId); // Ensure timeout is cleared in catch block as well
    if (error.name === 'AbortError') {
      console.warn('Dictionary API request timed out.');
    } else {
      console.error('Error fetching word definitions:', error);
    }
    return null; // Indicates a network or other fetch error
  }
};