const express = require('express');
const next = require('next');
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const apiPaths = {
  '/api': {
    target: process.env.BACKEND_URL || 'http://localhost:5000',
    pathRewrite: {
      '^/api': '/api'
    },
    changeOrigin: true
  },
  '/logout': {
    target: process.env.BACKEND_URL || 'http://localhost:5000',
    pathRewrite: {
      '^/': '/api/'
    },
    changeOrigin: true
  },
};

app.prepare().then(() => {
  const server = express()
  server.use('/api', createProxyMiddleware(apiPaths['/api']));
  server.use('/logout', createProxyMiddleware(apiPaths['/logout']));

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
}).catch(err => {
  console.log('Error:', err)
});