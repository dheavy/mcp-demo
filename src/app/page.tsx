'use client';

import { useState, useEffect } from 'react';
import { MCPTool } from '@/mcp-server/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import RealtimeMCPClient from '@/components/RealtimeMCPClient';

interface MCPResponse {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export default function Home() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [toolInput, setToolInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'http' | 'websocket'>('http');

  // Load available tools and resources on component mount.
  useEffect(() => {
    if (user) {
      loadTools();
      loadResources();
      checkServerStatus();
    }
  }, [user]);

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

  const loadResources = async () => {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'resources/list',
        }),
      });
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
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
      case 'web_search':
        return { query: input };
      case 'db_query':
        return { sql: input };
      case 'db_schema':
        return {};
      case 'db_samples':
        return {};
      default:
        return {};
    }
  };

  const readResource = async (uri: string) => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'resources/read',
          params: { uri },
        }),
      });

      const data = await response.json();

      if (data.error) {
        setResult(`❌ Error: ${data.error}`);
      } else {
        setResult(
          `📄 Resource: ${uri}\n\n${data.contents[0]?.text || 'No content'}`
        );
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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not logged in
  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onSuccess={login}
        onSwitchMode={() =>
          setAuthMode(authMode === 'login' ? 'register' : 'login')
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI Assistant Hub
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome,{' '}
                  <span className="font-semibold">{user.username}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Role: <span className="capitalize">{user.role}</span>
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            MCP (Model Context Protocol) Demo Application
          </p>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {serverStatus}
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('http')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'http'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  HTTP MCP Client
                </button>
                <button
                  onClick={() => setActiveTab('websocket')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'websocket'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Real-time WebSocket Client
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'websocket' ? (
            <RealtimeMCPClient />
          ) : (
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
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

                      {selectedTool === 'web_search' && (
                        <input
                          type="text"
                          value={toolInput}
                          onChange={e => setToolInput(e.target.value)}
                          placeholder="Enter search query (e.g., MCP model context protocol, Next.js TypeScript)..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      )}

                      {selectedTool === 'db_query' && (
                        <textarea
                          value={toolInput}
                          onChange={e => setToolInput(e.target.value)}
                          placeholder="Enter SQL SELECT query (e.g., SELECT * FROM users, SELECT * FROM products WHERE stock < 20)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
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

              {/* Resources Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Available Resources
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {resources.map(resource => (
                    <div
                      key={resource.uri}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedResource === resource.uri
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedResource(resource.uri);
                        setSelectedTool('');
                        setToolInput('');
                        setResult('');
                      }}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {resource.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                        {resource.uri}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedResource && (
                  <button
                    onClick={() => readResource(selectedResource)}
                    disabled={loading}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Loading...' : 'Read Resource'}
                  </button>
                )}
              </div>
            </div>
          )}

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
                <li>
                  Set up an MCP server in Next.js with 9 tools and 7 resources.
                </li>
                <li>
                  Define and register tools (weather, filesystem, search,
                  database).
                </li>
                <li>
                  Handle tool calls and responses with proper error handling.
                </li>
                <li>
                  Manage MCP resources (documentation, APIs, configuration).
                </li>
                <li>Create a modern web interface for MCP interactions.</li>
                <li>Implement database operations with SQLite.</li>
                <li>Build web search capabilities with mock results.</li>
                <li>Add authentication and authorization with JWT tokens.</li>
                <li>Implement real-time WebSocket communication for MCP.</li>
                <li>
                  Create both HTTP and WebSocket MCP clients for comparison.
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
