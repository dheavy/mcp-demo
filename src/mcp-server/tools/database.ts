/**
 * Database Operations Tool Implementation.
 */
import { MCPToolResult } from '../types';
import { registerTool } from './index';
import { getDatabase } from '../../lib/database';

// Execute SQL query tool handler.
async function queryHandler(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  const { sql } = args;

  if (!sql || typeof sql !== 'string') {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: SQL query is required and must be a string',
        },
      ],
      isError: true,
    };
  }

  try {
    const db = getDatabase();

    // Security check - only allow SELECT queries for demo
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql.startsWith('select')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Only SELECT queries are allowed in this demo for security reasons',
          },
        ],
        isError: true,
      };
    }

    // Execute query.
    const stmt = db.prepare(sql);
    const results = stmt.all();

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ Query executed successfully. No results found.',
          },
        ],
      };
    }

    // Format results as a table.
    const columns = Object.keys(results[0] as Record<string, unknown>);
    const header = columns.join(' | ');
    const separator = columns.map(() => '---').join(' | ');
    const rows = (results as Record<string, unknown>[]).map(
      (row: Record<string, unknown>) =>
        columns.map(col => String(row[col] || 'NULL')).join(' | ')
    );

    const table = [header, separator, ...rows].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Query executed successfully. Found ${results.length} row(s):\n\n\`\`\`\n${table}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing query: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

async function schemaHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: Record<string, unknown>
): Promise<MCPToolResult> {
  try {
    const db = getDatabase();

    // Get table information
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
      )
      .all() as { name: string }[];

    if (tables.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No tables found in the database.',
          },
        ],
      };
    }

    let schemaInfo = '📊 Database Schema:\n\n';

    for (const table of tables) {
      const columns = db
        .prepare(`PRAGMA table_info(${table.name})`)
        .all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;

      schemaInfo += `**${table.name}**\n`;
      schemaInfo += columns
        .map(
          col =>
            `  - ${col.name} (${col.type})${col.pk ? ' [PRIMARY KEY]' : ''}${
              col.notnull ? ' [NOT NULL]' : ''
            }`
        )
        .join('\n');
      schemaInfo += '\n\n';
    }

    return {
      content: [
        {
          type: 'text',
          text: schemaInfo,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting schema: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Get sample queries tool handler
async function samplesHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: Record<string, unknown>
): Promise<MCPToolResult> {
  const sampleQueries = [
    {
      name: 'List all users',
      sql: 'SELECT * FROM users',
      description: 'Get all users in the database',
    },
    {
      name: 'List all products',
      sql: 'SELECT * FROM products',
      description: 'Get all products with their details',
    },
    {
      name: 'List all orders',
      sql: 'SELECT * FROM orders',
      description: 'Get all orders with their details',
    },
    {
      name: 'Users with their orders',
      sql: `SELECT u.name, u.email, o.id as order_id, o.total, o.status
            FROM users u
            JOIN orders o ON u.id = o.user_id`,
      description: 'Get users with their associated orders',
    },
    {
      name: 'Product sales summary',
      sql: `SELECT p.name, p.price, SUM(o.quantity) as total_sold, SUM(o.total) as total_revenue
            FROM products p
            JOIN orders o ON p.id = o.product_id
            GROUP BY p.id, p.name, p.price`,
      description: 'Get sales summary for each product',
    },
    {
      name: 'Low stock products',
      sql: 'SELECT * FROM products WHERE stock < 20',
      description: 'Find products with low stock levels',
    },
  ];

  const queryList = sampleQueries
    .map(
      (query, index) =>
        `${index + 1}. **${query.name}**\n   \`${query.sql}\`\n   📝 ${
          query.description
        }`
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `💡 Sample SQL Queries:\n\n${queryList}\n\n⚠️ Note: Only SELECT queries are allowed for security.`,
      },
    ],
  };
}

registerTool({
  name: 'db_query',
  description: 'Execute SQL SELECT queries on the demo database',
  inputSchema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'SQL SELECT query to execute',
      },
    },
    required: ['sql'],
  },
  handler: queryHandler,
});

registerTool({
  name: 'db_schema',
  description: 'Get the database schema and table information',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: schemaHandler,
});

registerTool({
  name: 'db_samples',
  description: 'Get sample SQL queries for the demo database',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: samplesHandler,
});
