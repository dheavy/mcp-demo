/**
 * Weather Tool Implementation.
 */
import { MCPToolResult } from '../types';
import { registerTool } from './index';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: string;
}

// Mock weather data (in a real app, you'd use a real API like OpenWeatherMap).
async function getWeatherData(location: string): Promise<WeatherData> {
  // Simulate API delay.
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock weather data.
  const mockData: Record<string, WeatherData> = {
    london: {
      location: 'London, UK',
      temperature: 15,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12,
      timestamp: new Date().toISOString(),
    },
    'new york': {
      location: 'New York, USA',
      temperature: 22,
      description: 'Sunny',
      humidity: 45,
      windSpeed: 8,
      timestamp: new Date().toISOString(),
    },
    tokyo: {
      location: 'Tokyo, Japan',
      temperature: 18,
      description: 'Light rain',
      humidity: 80,
      windSpeed: 15,
      timestamp: new Date().toISOString(),
    },
    paris: {
      location: 'Paris, France',
      temperature: 16,
      description: 'Overcast',
      humidity: 70,
      windSpeed: 10,
      timestamp: new Date().toISOString(),
    },
  };

  const normalizedLocation = location.toLowerCase().trim();
  const weather = mockData[normalizedLocation];

  if (!weather) {
    // Generate random weather for unknown locations
    return {
      location: location,
      temperature: Math.floor(Math.random() * 30) + 5,
      description: ['Sunny', 'Cloudy', 'Partly cloudy', 'Light rain'][
        Math.floor(Math.random() * 4)
      ],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      timestamp: new Date().toISOString(),
    };
  }

  return weather;
}

// Weather tool handler.
async function weatherHandler(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  const { location } = args;

  if (!location || typeof location !== 'string') {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Location is required and must be a string',
        },
      ],
      isError: true,
    };
  }

  try {
    const weather = await getWeatherData(location);

    return {
      content: [
        {
          type: 'text',
          text: `🌤️ Weather for ${weather.location}:

🌡️ Temperature: ${weather.temperature}°C
☁️ Conditions: ${weather.description}
💧 Humidity: ${weather.humidity}%
💨 Wind Speed: ${weather.windSpeed} km/h
🕐 Updated: ${new Date(weather.timestamp).toLocaleString()}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching weather data: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Register the weather tool.
registerTool({
  name: 'get_weather',
  description: 'Get current weather information for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description:
          'The city or location to get weather for (e.g., "London", "New York", "Tokyo")',
      },
    },
    required: ['location'],
  },
  handler: weatherHandler,
});
