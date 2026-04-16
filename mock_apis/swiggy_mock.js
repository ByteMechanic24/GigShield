const { createSeedOrders } = require('./orderFactory');

const statuses = [
  ...Array(7).fill('IN_TRANSIT'),
  ...Array(2).fill('DELIVERED'),
  ...Array(1).fill('CANCELLED'),
];

module.exports = createSeedOrders({
  total: 10,
  statuses,
  prefix: 'SWG',
  datePart: '20240620',
  platform: 'swiggy',
  cityRotation: ['Greater Noida', 'Delhi', 'Mumbai', 'Greater Noida'],
});
