let io = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT']
    }
  });

  io.on('connection', (socket) => {
    // Customer tracking specific order
    socket.on('track_order', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
      }
    });

    // Customer personal notifications room
    socket.on('join_customer', (userId) => {
      if (userId) {
        socket.join(`customer_${userId}`);
      }
    });

    // Kitchen & staff live order screen
    socket.on('join_kitchen', () => {
      socket.join('kitchen_channel');
    });

    // Admin dashboard channel
    socket.on('join_admin', () => {
      socket.join('admin_channel');
    });

    socket.on('disconnect', () => {});
  });

  console.log('[Drinko Real-Time] Socket.IO server initialized successfully.');
  return io;
};

const getIO = () => {
  return io;
};

// Real-time broadcast helpers
const notifyOrderStatusChanged = (order) => {
  if (!io) return;
  const payload = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    updatedAt: order.updatedAt,
    order
  };

  // Notify order room
  io.to(`order_${order._id}`).emit('order_status_updated', payload);

  // Notify customer personal channel
  if (order.customer) {
    io.to(`customer_${order.customer}`).emit('order_status_updated', payload);
  }

  // Notify kitchen & admin
  io.to('kitchen_channel').emit('order_status_updated', payload);
  io.to('admin_channel').emit('order_status_updated', payload);
};

const notifyNewOrderPlaced = (order) => {
  if (!io) return;
  io.to('kitchen_channel').emit('new_order_placed', { order });
  io.to('admin_channel').emit('new_order_placed', { order });
};

const notifyInventoryAlert = (inventoryItem) => {
  if (!io) return;
  io.to('admin_channel').emit('inventory_alert', {
    ingredient: inventoryItem.ingredient,
    quantity: inventoryItem.quantity,
    unit: inventoryItem.unit,
    minimumStock: inventoryItem.minimumStock
  });
};

module.exports = {
  initSocket,
  getIO,
  notifyOrderStatusChanged,
  notifyNewOrderPlaced,
  notifyInventoryAlert
};
