const express = require('express');
const router = express.Router();
const {
  getNextBillNumber,
  createBill,
  updateBill,
  getAllBills,
  getBillById,
  deleteBill,
  getBillStats,
} = require('../controllers/billController');

router.get('/next-number', getNextBillNumber);
router.get('/stats/summary', getBillStats);
router.route('/').get(getAllBills).post(createBill);
router.route('/:id').get(getBillById).put(updateBill).delete(deleteBill);

module.exports = router;
