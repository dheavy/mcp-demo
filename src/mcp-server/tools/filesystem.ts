/**
 * File System Tool Implementation.
 */
import { MCPToolResult } from '../types';
import { registerTool } from './index';
import { promises as fs } from 'fs';
import path from 'path';

// Safe directory for file operations (project root).
const SAFE_DIRECTORY = process.cwd();

// Check if path is safe (within project directory).
function isSafePath(filePath: string): boolean {
  const resolvedPath = path.resolve(SAFE_DIRECTORY, filePath);
  return resolvedPath.startsWith(SAFE_DIRECTORY);
}

// List files in a directory.
async function listFilesHandler(
  args: Record<string, any>
): Promise<MCPToolResult> {
  const { directory = '.' } = args;

  if (!isSafePath(directory)) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Access denied. Path is outside safe directory.',
        },
      ],
      isError: true,
    };
  }

  try {
    const fullPath = path.resolve(SAFE_DIRECTORY, directory);
    const items = await fs.readdir(fullPath, { withFileTypes: true });

    const files = items
      .map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(directory, item.name),
      }))
      .sort((a, b) => {
        // Directories first, then files.
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `📁 Directory "${directory}" is empty`,
          },
        ],
      };
    }

    const fileList = files
      .map(file => `${file.type === 'directory' ? '📁' : '📄'} ${file.name}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📁 Contents of "${directory}":\n\n${fileList}\n\nTotal: ${files.length} items`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading directory: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Read a file
async function readFileHandler(
  args: Record<string, any>
): Promise<MCPToolResult> {
  const { filepath } = args;

  if (!filepath || typeof filepath !== 'string') {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: File path is required and must be a string',
        },
      ],
      isError: true,
    };
  }

  if (!isSafePath(filepath)) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Access denied. Path is outside safe directory.',
        },
      ],
      isError: true,
    };
  }

  try {
    const fullPath = path.resolve(SAFE_DIRECTORY, filepath);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Path is a directory, not a file',
          },
        ],
        isError: true,
      };
    }

    // Check file size (limit to 1MB for demo)
    if (stats.size > 1024 * 1024) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: File is too large (>1MB). Use a smaller file for this demo.',
          },
        ],
        isError: true,
      };
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n').length;

    return {
      content: [
        {
          type: 'text',
          text: `📄 File: ${filepath}\n📊 Size: ${stats.size} bytes, ${lines} lines\n\n${content}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Register file system tools
registerTool({
  name: 'list_files',
  description: 'List files and directories in a specified path',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Directory path to list (defaults to current directory)',
        default: '.',
      },
    },
  },
  handler: listFilesHandler,
});

registerTool({
  name: 'read_file',
  description: 'Read the contents of a text file',
  inputSchema: {
    type: 'object',
    properties: {
      filepath: {
        type: 'string',
        description: 'Path to the file to read',
      },
    },
    required: ['filepath'],
  },
  handler: readFileHandler,
});
