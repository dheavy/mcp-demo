'use client';

import { useState, useEffect } from 'react';
import { MCPTool } from '@/mcp-server/types';

interface MCPResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

export default function Home() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolInput, setToolInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<string>('');

  // Load available tools on component mount.
  useEffect(() => {
    loadTools();
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/mcp');
      const data = await response.json();
      setServerStatus(
        `✅ Server running - ${data.config.toolsCount} tools available`
      );
    } catch (error) {
      setServerStatus('❌ Server not responding');
    }
  };

  const loadTools = async () => {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/list',
        }),
      });
      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const getToolArguments = (
    toolName: string,
    input: string
  ): Record<string, any> => {
    switch (toolName) {
      case 'echo':
        return { message: input };
      case 'get_weather':
        return { location: input };
      case 'list_files':
        return { directory: input || '.' };
      case 'read_file':
        return { filepath: input };
      case 'get_time':
        return {};
      default:
        return {};
    }
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: getToolArguments(selectedTool, toolInput),
          },
        }),
      });

      const data: MCPResponse = await response.json();

      if (data.isError) {
        setResult(`❌ Error: ${data.content[0]?.text || 'Unknown error'}`);
      } else {
        setResult(`✅ ${data.content[0]?.text || 'No response'}`);
      }
    } catch (error) {
      setResult(
        `❌ Network error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Assistant Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            MCP (Model Context Protocol) Demo Application
          </p>
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {serverStatus}
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Tool Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Available Tools
              </h2>

              <div className="space-y-3">
                {tools.map(tool => (
                  <div
                    key={tool.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTool === tool.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedTool(tool.name);
                      setToolInput('');
                      setResult('');
                    }}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tool Execution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Execute Tool
              </h2>

              {selectedTool && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Tool: {selectedTool}
                    </label>

                    {selectedTool === 'echo' && (
                      <input
                        type="text"
                        value={toolInput}
                        onChange={e => setToolInput(e.target.value)}
                        placeholder="Enter message to echo..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}

                    {selectedTool === 'get_weather' && (
                      <input
                        type="text"
                        value={toolInput}
                        onChange={e => setToolInput(e.target.value)}
                        placeholder="Enter city name (e.g., London, New York, Tokyo)..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}

                    {selectedTool === 'list_files' && (
                      <input
                        type="text"
                        value={toolInput}
                        onChange={e => setToolInput(e.target.value)}
                        placeholder="Enter directory path (e.g., src, .) or leave empty for current directory..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}

                    {selectedTool === 'read_file' && (
                      <input
                        type="text"
                        value={toolInput}
                        onChange={e => setToolInput(e.target.value)}
                        placeholder="Enter file path (e.g., package.json, src/app/page.tsx)..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}
                  </div>

                  <button
                    onClick={executeTool}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Executing...' : 'Execute Tool'}
                  </button>
                </div>
              )}

              {result && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Result:
                  </h3>
                  <pre className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap overflow-x-auto">
                    {result}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Learning Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What is MCP?
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The Model Context Protocol (MCP) is a standard for connecting AI
                models to external tools and data sources. This demo was made to
                learn how to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Set up an MCP server in Next.js.</li>
                <li>Define and register tools.</li>
                <li>Handle tool calls and responses.</li>
                <li>Create a web interface for MCP interactions.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
