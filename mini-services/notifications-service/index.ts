import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

const PORT = 3003

// Track connected clients by role
const connectedClients = new Map<string, { id: string; role: string; name: string }>()

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`)

  // Client sends their identity on connect
  socket.on('identify', (data: { id: string; role: string; name: string }) => {
    connectedClients.set(socket.id, data)
    console.log(`[WS] Identified: ${data.name} (${data.role})`)
    
    // Send welcome event
    socket.emit('connected', { message: `Welcome, ${data.name}!`, timestamp: new Date().toISOString() })
  })

  // Broadcast notification to all clients or specific role
  socket.on('notification', (data: { type: string; title: string; body?: string; severity?: string; role?: string }) => {
    console.log(`[WS] Notification: ${data.title}`)
    if (data.role) {
      // Send to specific role only
      connectedClients.forEach((client, socketId) => {
        if (client.role === data.role) {
          io.to(socketId).emit('notification', data)
        }
      })
    } else {
      // Broadcast to all
      io.emit('notification', data)
    }
  })

  // Broadcast dashboard refresh signal
  socket.on('dashboard-refresh', () => {
    io.emit('refresh-dashboard')
  })

  socket.on('disconnect', () => {
    const client = connectedClients.get(socket.id)
    if (client) {
      console.log(`[WS] Disconnected: ${client.name} (${client.role})`)
      connectedClients.delete(socket.id)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`[WS] Rise Foods notifications service running on port ${PORT}`)
})
