/**
 * Web Search Tool Implementation.
 */
import { MCPToolResult } from '../types';
import { registerTool } from './index';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

// Mock search results for demonstration.
const mockSearchResults: Record<string, SearchResult[]> = {
  'mcp model context protocol': [
    {
      title: 'Model Context Protocol - Official Documentation',
      url: 'https://modelcontextprotocol.info',
      snippet:
        'The Model Context Protocol (MCP) is a standard for connecting AI models to external tools and data sources.',
      relevance: 0.95,
    },
    {
      title: 'MCP GitHub Repository',
      url: 'https://github.com/modelcontextprotocol',
      snippet:
        'Open source implementation of the Model Context Protocol with examples and SDKs.',
      relevance: 0.9,
    },
    {
      title: 'Building MCP Servers - Tutorial',
      url: 'https://modelcontextprotocol.info/tutorials',
      snippet:
        'Learn how to build MCP servers and integrate them with AI models.',
      relevance: 0.85,
    },
  ],
  'next.js typescript': [
    {
      title: 'Next.js with TypeScript - Official Guide',
      url: 'https://nextjs.org/docs/basic-features/typescript',
      snippet:
        'Learn how to use TypeScript with Next.js for type-safe development.',
      relevance: 0.95,
    },
    {
      title: 'Next.js TypeScript Examples',
      url: 'https://github.com/vercel/next.js/tree/canary/examples',
      snippet: 'Collection of Next.js examples with TypeScript integration.',
      relevance: 0.88,
    },
  ],
  'weather api': [
    {
      title: 'OpenWeatherMap API',
      url: 'https://openweathermap.org/api',
      snippet:
        'Free weather API with current weather, forecasts, and historical data.',
      relevance: 0.92,
    },
    {
      title: 'Weather API Comparison',
      url: 'https://rapidapi.com/blog/weather-api-comparison',
      snippet: 'Compare different weather APIs for your application needs.',
      relevance: 0.8,
    },
  ],
};

// Generate mock search results for unknown queries.
function generateMockResults(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const words = query.toLowerCase().split(' ');

  for (let i = 0; i < 3; i++) {
    results.push({
      title: `${query} - Search Result ${i + 1}`,
      url: `https://example.com/search/${encodeURIComponent(query)}/${i + 1}`,
      snippet: `This is a mock search result for "${query}". It contains information about ${words.join(
        ' and '
      )}.`,
      relevance: 0.8 - i * 0.1,
    });
  }

  return results;
}

// Web search tool handler.
async function searchHandler(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  const { query, limit = 5 } = args;

  if (!query || typeof query !== 'string') {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Search query is required and must be a string',
        },
      ],
      isError: true,
    };
  }

  try {
    // Simulate API delay.
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedQuery = query.toLowerCase().trim();
    let results: SearchResult[] = [];

    // Check for exact matches in mock data
    if (mockSearchResults[normalizedQuery]) {
      results = mockSearchResults[normalizedQuery];
    } else {
      // Check for partial matches
      for (const [key, value] of Object.entries(mockSearchResults)) {
        if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
          results = [...results, ...value];
          break;
        }
      }

      // If no matches found, generate mock results
      if (results.length === 0) {
        results = generateMockResults(query);
      }
    }

    // Limit results
    const limitedResults = results.slice(0, Math.min(Number(limit), 10));

    // Format results
    const formattedResults = limitedResults
      .map(
        (result, index) =>
          `${index + 1}. **${result.title}**\n   🔗 ${result.url}\n   📝 ${
            result.snippet
          }\n   ⭐ Relevance: ${(result.relevance * 100).toFixed(0)}%`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔍 Search Results for "${query}" (${limitedResults.length} results):\n\n${formattedResults}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error performing search: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Register the search tool
registerTool({
  name: 'web_search',
  description: 'Search the web for information on any topic',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or topic to search for',
      },
      limit: {
        type: 'number',
        description:
          'Maximum number of results to return (default: 5, max: 10)',
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['query'],
  },
  handler: searchHandler,
});
