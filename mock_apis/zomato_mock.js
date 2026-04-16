const { createSeedOrders } = require('./orderFactory');

const statuses = [
  ...Array(15).fill('IN_TRANSIT'),
  ...Array(3).fill('DELIVERED'),
  ...Array(2).fill('CANCELLED'),
];

module.exports = createSeedOrders({
  total: 20,
  statuses,
  prefix: 'ZOM',
  datePart: '20240716',
  platform: 'zomato',
  cityRotation: ['Greater Noida', 'Delhi', 'Mumbai', 'Greater Noida', 'Bangalore'],
});
