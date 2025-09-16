'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ToolExecution {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: unknown;
  error?: string;
  timestamp: number;
}

interface ResourceRead {
  id: string;
  uri: string;
  status: 'pending' | 'reading' | 'completed' | 'error';
  content?: unknown;
  error?: string;
  timestamp: number;
}

export default function RealtimeMCPClient() {
  const { isConnected, isConnecting, error, sendMessage } = useWebSocket();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArguments, setToolArguments] = useState<Record<string, unknown>>(
    {}
  );
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [resourceReads, setResourceReads] = useState<ResourceRead[]>([]);
  const [resources, setResources] = useState<unknown[]>([]);
  const [tools, setTools] = useState<unknown[]>([]);

  // Load tools and resources via WebSocket when connected
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected) return;

      try {
        // Fetch tools via WebSocket
        const toolsResponse = await sendMessage({
          type: 'mcp_request',
          method: 'tools/list',
        });

        if (
          toolsResponse.result &&
          typeof toolsResponse.result === 'object' &&
          'tools' in toolsResponse.result
        ) {
          setTools((toolsResponse.result as { tools: unknown[] }).tools);
        }

        // Fetch resources via WebSocket
        const resourcesResponse = await sendMessage({
          type: 'mcp_request',
          method: 'resources/list',
        });

        if (
          resourcesResponse.result &&
          typeof resourcesResponse.result === 'object' &&
          'resources' in resourcesResponse.result
        ) {
          setResources(
            (resourcesResponse.result as { resources: unknown[] }).resources
          );
        }
      } catch (error) {
        console.error('Error loading tools and resources:', error);
      }
    };

    loadData();
  }, [isConnected, sendMessage]);

  const getToolArguments = (toolName: string) => {
    const tool = tools.find(
      t =>
        typeof t === 'object' &&
        t !== null &&
        'name' in t &&
        (t as { name: string }).name === toolName
    ) as
      | { name: string; inputSchema?: { properties?: Record<string, unknown> } }
      | undefined;
    if (!tool) return {};

    const args: Record<string, unknown> = {};
    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(
        ([key, prop]: [string, unknown]) => {
          if (typeof prop === 'object' && prop !== null && 'type' in prop) {
            const typedProp = prop as { type: string; default?: unknown };
            if (typedProp.type === 'string') {
              args[key] = typedProp.default || '';
            } else if (typedProp.type === 'number') {
              args[key] = typedProp.default || 0;
            } else if (typedProp.type === 'boolean') {
              args[key] = typedProp.default || false;
            } else if (typedProp.type === 'array') {
              args[key] = typedProp.default || [];
            } else {
              args[key] = typedProp.default || '';
            }
          } else {
            args[key] = '';
          }
        }
      );
    }
    return args;
  };

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setToolArguments(getToolArguments(toolName));
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    const executionId = `exec_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const execution: ToolExecution = {
      id: executionId,
      toolName: selectedTool,
      arguments: toolArguments,
      status: 'pending',
      timestamp: Date.now(),
    };

    setExecutions(prev => [execution, ...prev]);

    try {
      setExecutions(prev =>
        prev.map(e =>
          e.id === executionId ? { ...e, status: 'executing' } : e
        )
      );

      const response = await sendMessage({
        type: 'mcp_request',
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments: toolArguments,
        },
      });

      setExecutions(prev =>
        prev.map(e =>
          e.id === executionId
            ? {
                ...e,
                status: 'completed',
                result: response.result,
              }
            : e
        )
      );
    } catch (error) {
      setExecutions(prev =>
        prev.map(e =>
          e.id === executionId
            ? {
                ...e,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : e
        )
      );
    }
  };

  const readResource = async (uri: string) => {
    const readId = `read_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const resourceRead: ResourceRead = {
      id: readId,
      uri,
      status: 'pending',
      timestamp: Date.now(),
    };

    setResourceReads(prev => [resourceRead, ...prev]);

    try {
      setResourceReads(prev =>
        prev.map(r => (r.id === readId ? { ...r, status: 'reading' } : r))
      );

      const response = await sendMessage({
        type: 'mcp_request',
        method: 'resources/read',
        params: { uri },
      });

      setResourceReads(prev =>
        prev.map(r =>
          r.id === readId
            ? {
                ...r,
                status: 'completed',
                content: response.result,
              }
            : r
        )
      );
    } catch (error) {
      setResourceReads(prev =>
        prev.map(r =>
          r.id === readId
            ? {
                ...r,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : r
        )
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'executing':
        return 'text-blue-600 bg-blue-100';
      case 'reading':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'executing':
        return '⚡';
      case 'reading':
        return '📖';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Real-time MCP Client
          </h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? 'bg-green-500'
                  : isConnecting
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isConnected
                ? 'Connected'
                : isConnecting
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Tools ({tools.length})
          </h3>
          <div className="space-y-2">
            {tools.map(tool => {
              if (
                typeof tool === 'object' &&
                tool !== null &&
                'name' in tool &&
                'description' in tool
              ) {
                const typedTool = tool as { name: string; description: string };
                return (
                  <button
                    key={typedTool.name}
                    onClick={() => handleToolSelect(typedTool.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTool === typedTool.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {typedTool.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {typedTool.description}
                    </div>
                  </button>
                );
              }
              return null;
            })}
          </div>

          {selectedTool && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Tool Arguments
              </h4>
              <div className="space-y-2">
                {Object.entries(toolArguments).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={e =>
                        setToolArguments(prev => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={executeTool}
                disabled={!isConnected}
                className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Execute Tool
              </button>
            </div>
          )}
        </div>

        {/* Execution Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Execution History
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {executions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No executions yet
              </p>
            ) : (
              executions.map(execution => (
                <div
                  key={execution.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {execution.toolName}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        execution.status
                      )}`}
                    >
                      {getStatusIcon(execution.status)} {execution.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(execution.timestamp).toLocaleTimeString()}
                  </div>
                  {execution.result !== undefined && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {JSON.stringify(execution.result, null, 2)}
                      </pre>
                    </div>
                  )}
                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                      {execution.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resources Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Resources ({resources.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resources.map(resource => {
              if (
                typeof resource === 'object' &&
                resource !== null &&
                'uri' in resource &&
                'name' in resource &&
                'description' in resource
              ) {
                const typedResource = resource as {
                  uri: string;
                  name: string;
                  description: string;
                };
                return (
                  <div
                    key={typedResource.uri}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {typedResource.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {typedResource.description}
                    </div>
                    <button
                      onClick={() => readResource(typedResource.uri)}
                      disabled={!isConnected}
                      className="w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Read Resource
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Resource Read Results */}
          {resourceReads.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Resource Reads
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {resourceReads.map(read => (
                  <div
                    key={read.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {read.uri}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          read.status
                        )}`}
                      >
                        {getStatusIcon(read.status)} {read.status}
                      </span>
                    </div>
                    {read.content !== undefined && (
                      <div className="mt-1 p-1 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 max-h-20 overflow-y-auto">
                          {JSON.stringify(read.content, null, 2)}
                        </pre>
                      </div>
                    )}
                    {read.error && (
                      <div className="mt-1 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                        {read.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
