const socketIo = require('socket.io');
const { admin } = require('../config/firebase');
const GameRoom = require('../models/GameRoom');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const crypto = require('crypto');

let io;

// In-memory tracking for quick matchmaking
// Wait queues for modes
const queues = {
    '2_PLAYER': [],
    '4_PLAYER': [],
};

// Map socket id to user object
const socketUsers = {};

const generateRoomCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));

            const decodedToken = await admin.auth().verifyIdToken(token);

            // Wait to bind to Mongo user in case we need _id
            const user = await User.findOne({ uid: decodedToken.uid });
            if (!user) return next(new Error('User not found'));
            if (user.isBanned) return next(new Error('User is banned'));

            socket.user = {
                _id: user._id.toString(),
                uid: decodedToken.uid,
                email: decodedToken.email
            };
            socketUsers[socket.id] = socket.user._id;

            next();
        } catch (error) {
            console.error('Socket Auth Error:', error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.user.uid} (${socket.id})`);

        // Join Matchmaking Auto (2 or 4 player)
        socket.on('join_auto_match', async ({ mode }) => {
            if (mode !== '2_PLAYER' && mode !== '4_PLAYER') return;

            // Check if already in queue
            if (!queues[mode].includes(socket.id)) {
                queues[mode].push(socket.id);
            }

            console.log(`${socket.user.uid} joined ${mode} queue. Total: ${queues[mode].length}`);

            const requiredPlayers = mode === '2_PLAYER' ? 2 : 4;
            if (queues[mode].length >= requiredPlayers) {
                // We have enough players, create a room!
                const matchedSockets = queues[mode].splice(0, requiredPlayers);

                const roomCode = generateRoomCode();
                const playersData = matchedSockets.map((sId, index) => {
                    const colors = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
                    return {
                        user: socketUsers[sId],
                        color: colors[index],
                    };
                });

                // Create GameRoom in DB
                const room = await GameRoom.create({
                    roomCode,
                    mode,
                    status: 'IN_PROGRESS',
                    players: playersData,
                    startTime: new Date()
                });

                // Notify players
                matchedSockets.forEach(sId => {
                    const s = io.sockets.sockets.get(sId);
                    if (s) {
                        s.join(roomCode);
                        s.emit('match_found', { roomCode, mode, players: playersData, roomId: room._id });
                    }
                });
            }
        });

        // Create Private Room
        socket.on('create_private_room', async () => {
            const roomCode = generateRoomCode();
            const room = await GameRoom.create({
                roomCode,
                mode: 'PRIVATE',
                status: 'WAITING',
                players: [{ user: socket.user._id, color: 'RED' }] // Host is usually Red
            });

            socket.join(roomCode);
            socket.emit('private_room_created', { roomCode, roomId: room._id });
        });

        // Join Private Room
        socket.on('join_private_room', async ({ roomCode }) => {
            const room = await GameRoom.findOne({ roomCode, status: 'WAITING', mode: 'PRIVATE' });
            if (!room) {
                return socket.emit('error', { message: 'Room not found or already started' });
            }

            if (room.players.length >= 4) {
                return socket.emit('error', { message: 'Room is full' });
            }

            const availableColors = ['RED', 'GREEN', 'YELLOW', 'BLUE'].filter(
                c => !room.players.some(p => p.color === c)
            );

            room.players.push({ user: socket.user._id, color: availableColors[0] });
            await room.save();

            socket.join(roomCode);
            io.to(roomCode).emit('player_joined', { players: room.players });
        });

        // Start Private Game
        socket.on('start_private_game', async ({ roomCode }) => {
            const room = await GameRoom.findOne({ roomCode, status: 'WAITING' });
            if (room && room.players[0].user.toString() === socket.user._id) {
                room.status = 'IN_PROGRESS';
                room.startTime = new Date();
                await room.save();
                io.to(roomCode).emit('game_started', { room });
            }
        });

        // Game Play Events
        socket.on('roll_dice', async ({ roomCode }) => {
            // Fairness: Server generates the dice roll!
            const roll = Math.floor(Math.random() * 6) + 1;
            io.to(roomCode).emit('dice_rolled', { user: socket.user._id, roll });
        });

        socket.on('move_pawn', ({ roomCode, pawnId, from, to }) => {
            // Validate move legality logic would go here.
            // For now, broadcast to others:
            io.to(roomCode).emit('pawn_moved', { user: socket.user._id, pawnId, from, to });
        });

        socket.on('capture_pawn', ({ roomCode, pawnId, position, capturedUser }) => {
            io.to(roomCode).emit('pawn_captured', { user: socket.user._id, pawnId, position, capturedUser });
        });

        socket.on('game_over', async ({ roomCode, winners, totalBannerImpressions, estimatedCpm }) => {
            // Only accept game_over from trusted client consensus or server-side state engine
            // In a real strict environment, server tracks full state.
            // Let's assume the request comes in to close the room.

            const room = await GameRoom.findOne({ roomCode, status: 'IN_PROGRESS' });
            if (!room) return;

            room.status = 'COMPLETED';
            room.endTime = new Date();
            room.totalAdsWatched = totalBannerImpressions || 0;

            // Ad-Revenue Prize Pool System calculation
            const prizePool = room.calculatePrizePool(room.totalAdsWatched, estimatedCpm || 0.5);

            // Prize Distribution
            if (room.mode === '2_PLAYER') {
                // winner takes all
                const winnerId = winners[0]; // Assuming array of UIDs/ObjectIds in rank order
                const p = room.players.find(p => p.user.toString() === winnerId);
                if (p) {
                    p.isWinner = true;
                    p.rank = 1;
                    p.payoutReceived = prizePool;
                }
            } else if (room.mode === '4_PLAYER' || room.mode === 'PRIVATE') {
                // Distribute 60%, 30%, 10%
                const distribution = [0.6, 0.3, 0.1, 0];
                winners.forEach((winnerId, idx) => {
                    const p = room.players.find(p => p.user.toString() === winnerId);
                    if (p && idx < 4) {
                        p.rank = idx + 1;
                        p.payoutReceived = Math.floor(prizePool * distribution[idx]);
                    }
                });
            }

            await room.save();

            // Credit players
            for (const player of room.players) {
                if (player.payoutReceived > 0) {
                    const u = await User.findById(player.user);
                    if (u) {
                        u.coinBalance += player.payoutReceived;
                        await u.save();

                        await Transaction.create({
                            user: u._id,
                            type: 'EARN',
                            source: 'LUDO_WIN',
                            amount: player.payoutReceived,
                            description: `Prize pool share for game ${roomCode}`,
                        });
                    }
                }
            }

            io.to(roomCode).emit('match_ended', { room });
            // Close sockets and clean up
            io.socketsLeave(roomCode);
        });

        socket.on('chat_message', ({ roomCode, message }) => {
            io.to(roomCode).emit('chat_message_received', { user: socket.user._id, message });
        });

        socket.on('disconnect', () => {
            console.log(`User Disconnected: ${socket.user.uid}`);
            // Remove from queues
            Object.keys(queues).forEach(mode => {
                queues[mode] = queues[mode].filter(id => id !== socket.id);
            });
            delete socketUsers[socket.id];

            // Note: In real setup, emit 'player_disconnected' to the active room
            // io.to(roomCode).emit('player_disconnected', { user: socket.user._id });
            // Then handle AI takeover or match forfeiture
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIo };
