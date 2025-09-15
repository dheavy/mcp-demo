# Vercel Deployment Guide

## 🚨 Important Limitations

### WebSocket Support

- **Not Available**: Vercel doesn't support WebSocket servers in serverless functions
- **Workaround**: The app automatically detects Vercel and disables WebSocket features
- **Alternative**: Use the HTTP MCP Client for full functionality

### Database Considerations

- **SQLite**: May not work reliably in serverless environment
- **Recommendation**: Consider using Vercel Postgres or external database for production

## 📋 Pre-deployment Checklist

### 1. Environment Variables

Set these in your Vercel dashboard:

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 2. Package.json Scripts

The app has been configured with Vercel-compatible scripts:

- `npm run dev` - Standard Next.js development
- `npm run dev:full` - Full local development with WebSocket
- `npm run build` - Vercel-compatible build
- `npm run start` - Vercel-compatible start

### 3. Vercel Configuration

The `vercel.json` file is configured for:

- Next.js deployment
- API route optimization
- Environment variable handling

## 🚀 Deployment Steps

1. **Connect to Vercel**:

   ```bash
   npx vercel
   ```

2. **Set Environment Variables**:

   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `JWT_SECRET` with a secure random string

3. **Deploy**:
   ```bash
   npx vercel --prod
   ```

## ⚠️ Known Issues & Workarounds

### WebSocket Functionality

- **Issue**: WebSocket server won't work on Vercel
- **Solution**: App automatically detects Vercel and shows warning
- **User Experience**: HTTP MCP Client provides full functionality

### Database Persistence

- **Issue**: SQLite files may not persist between deployments
- **Solution**: Consider external database for production use

### File System Access

- **Issue**: Limited file system access in serverless
- **Solution**: File operations are restricted to safe paths

## 🔧 Production Recommendations

1. **Database**: Use Vercel Postgres or external database
2. **Authentication**: Consider OAuth providers for production
3. **File Storage**: Use external storage services
4. **Monitoring**: Add error tracking and analytics

## 📊 Feature Matrix

| Feature             | Local Development | Vercel Deployment |
| ------------------- | ----------------- | ----------------- |
| HTTP MCP Client     | ✅ Full           | ✅ Full           |
| WebSocket Client    | ✅ Full           | ❌ Disabled       |
| Authentication      | ✅ Full           | ✅ Full           |
| Database Operations | ✅ Full           | ⚠️ Limited        |
| File Operations     | ✅ Full           | ⚠️ Restricted     |
| Tool Execution      | ✅ Full           | ✅ Full           |
| Resource Access     | ✅ Full           | ✅ Full           |

## 🆘 Troubleshooting

### Build Failures

- Check that all dependencies are in `dependencies` not `devDependencies`
- Ensure TypeScript compilation passes
- Verify environment variables are set

### Runtime Errors

- Check Vercel function logs
- Verify database connections
- Test API routes individually

### Performance Issues

- Monitor function execution time
- Consider caching strategies
- Optimize database queries
