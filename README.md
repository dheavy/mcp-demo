# AI Assistant Hub - MCP Demo

A comprehensive demonstration of the **Model Context Protocol (MCP)** implemented in Next.js with TypeScript, featuring both HTTP and real-time WebSocket communication, authentication, and a modern web interface.

## Features

### Core MCP implementation

- **9 MCP tools**: Echo, time, weather, filesystem operations, web search, database queries
- **7 MCP resources**: Documentation, API specs, configuration files
- **Full MCP protocol support**: Tools, resources, and proper error handling
- **TypeScript integration**: Complete type safety throughout

### Dual communication modes

- **HTTP MCP client**: Traditional request/response pattern
- **Real-time WebSocket client**: Live communication with instant updates
- **Tab-based interface**: Easy switching between communication modes

### Authentication & security

- **JWT-based authentication**: Secure user sessions
- **Role-based access control**: Admin and user roles
- **HTTP-only cookies**: Secure token storage
- **Protected routes**: Authentication middleware

### Real-time features

- **Live tool execution**: Real-time status tracking
- **Instant resource access**: Immediate resource reading
- **Connection monitoring**: WebSocket connection status
- **Automatic reconnection**: Resilient connection handling
- **Execution history**: Timestamped operation logs

### Database & storage

- **SQLite integration**: Local database with sample data
- **Safe file operations**: Restricted filesystem access
- **Mock external APIs**: Weather and web search services

## 🛠️ Tech stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT with bcryptjs
- **WebSocket**: ws library
- **MCP SDK**: @modelcontextprotocol/sdk

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd mcp-demo
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Getting started

1. **Register/Login**: Create an account or use existing credentials
2. **Choose interface**: Switch between HTTP and WebSocket clients
3. **Execute tools**: Try different MCP tools with real-time feedback
4. **Read resources**: Access documentation and configuration files

### Available tools

- **echo**: Echo back messages
- **get_time**: Get current timestamp
- **get_weather**: Mock weather information
- **list_files**: Browse project files safely
- **read_file**: Read file contents with size limits
- **web_search**: Mock web search results
- **db_query**: Execute SQL SELECT queries
- **db_schema**: View database schema
- **db_samples**: Get sample database queries

### Available resources

- **MCP overview**: Introduction to Model Context Protocol
- **Tool development guide**: How to create MCP tools
- **Best practices**: Security and performance guidelines
- **API documentation**: Weather and database endpoints
- **Configuration**: Server settings and tool registry

## 🔧 Development

### Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── mcp/           # MCP HTTP endpoints
│   │   └── ws/            # WebSocket stats
│   ├── layout.tsx         # Root layout with auth provider
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── AuthForm.tsx       # Login/register forms
│   └── RealtimeMCPClient.tsx # WebSocket client
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
│   └── useWebSocket.ts    # WebSocket connection hook
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database setup
│   ├── middleware.ts      # Route protection
│   └── websocket-server.ts # WebSocket server
└── mcp-server/            # MCP implementation
    ├── tools/             # MCP tools
    ├── resources/         # MCP resources
    ├── server.ts          # MCP server
    └── types.ts           # TypeScript definitions
```

### Key files

- **`server.ts`**: Custom Next.js server with WebSocket support
- **`src/lib/websocket-server.ts`**: WebSocket server implementation
- **`src/hooks/useWebSocket.ts`**: React WebSocket hook
- **`src/mcp-server/`**: Complete MCP server implementation

### Adding new tools

1. Create a new tool file in `src/mcp-server/tools/`
2. Implement the tool with proper input validation
3. Register the tool in the tools index
4. The tool will automatically appear in both HTTP and WebSocket clients

### Adding new resources

1. Add resource definition in `src/mcp-server/resources/index.ts`
2. Implement content provider in `src/mcp-server/resources/content.ts`
3. Resources will be available in both communication modes

## Security features

- **Input validation**: All tool inputs are validated
- **Path security**: Filesystem operations are restricted to project directory
- **SQL injection protection**: Database queries are limited to SELECT statements
- **Authentication required**: All MCP operations require valid authentication
- **Role-based access**: Different permissions for admin and user roles

## 🌐 API endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### MCP HTTP

- `GET /api/mcp` - Server status
- `POST /api/mcp` - MCP method calls (tools/list, resources/list, etc.)

### WebSocket

- `ws://localhost:3000/ws/mcp` - WebSocket MCP connection
- `GET /api/ws/stats` - WebSocket connection statistics

## Deployment

### Local development

```bash
# Standard Next.js development (Vercel-compatible)
npm run dev

# Full development with WebSocket support
npm run dev:full
```

### Production build

```bash
npm run build
npm start
```

### Vercel deployment

1. **Connect to Vercel**:

   ```bash
   npx vercel
   ```

2. **Set environment variables** in Vercel dashboard:

   - `JWT_SECRET`: Secret key for JWT tokens
   - `NODE_ENV`: Set to `production`

3. **Deploy**:
   ```bash
   npx vercel --prod
   ```

**⚠️ Important**: WebSocket functionality is not available on Vercel. The app automatically detects Vercel and disables WebSocket features. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment information.

### Environment variables

- `JWT_SECRET`: Secret key for JWT tokens (default: development key)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

## 📚 Learning resources

This demo covers:

- **MCP protocol**: Complete implementation of Model Context Protocol
- **Tool development**: Creating and registering MCP tools
- **Resource management**: Handling MCP resources and content
- **Authentication**: JWT-based auth with role-based access
- **WebSocket integration**: Real-time communication patterns
- **Database operations**: SQLite integration with MCP
- **Security best practices**: Input validation and access control
- **Modern React patterns**: Hooks, contexts, and TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [Next.js](https://nextjs.org/) for the excellent React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
