const http = require('http');
const { Server } = require('socket.io');
const app = require('./app'); // your express app
const startCronJobs = require('./jobs/archiveNotes');

const server = http.createServer(app);
startCronJobs();


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const setupSocket = require('./config/socket');
const logger = require('./utils/logger');

setupSocket(io);

global.io = io; // So we can use it in controllers

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
