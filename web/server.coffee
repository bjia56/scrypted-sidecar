express = require 'express'
next = require 'next'
{ createProxyMiddleware } = require "http-proxy-middleware"

port = process.env.PORT || 3000
dev = process.env.NODE_ENV != 'production'
app = next { dev }
handle = app.getRequestHandler()

apiPaths = 
	'/api': 
		target: process.env.BACKEND_URL || 'http://localhost:5000'
		pathRewrite: 
			'^/api': '/api'
		changeOrigin: true
	'/socket.io': 
		target: process.env.BACKEND_URL || 'http://localhost:5000'
		pathRewrite: 
			'^/socket\\.io': '/socket.io'
		changeOrigin: true
	'/logout': 
		target: process.env.BACKEND_URL || 'http://localhost:5000'
		pathRewrite: 
			'^/': '/api/'

		changeOrigin: true


app.prepare().then () -> 
	server = express()
	server.use '/api', (createProxyMiddleware apiPaths['/api'])
	server.use '/socket.io', (createProxyMiddleware apiPaths['/socket.io'])
	server.use '/logout', (createProxyMiddleware apiPaths['/logout']) 

	server.all '*', (req, res) -> 
		handle(req, res)

	server.listen port, () -> 
		console.log '> Ready on http://localhost:'+port
.catch (err) -> 
	console.log('Error:', err)