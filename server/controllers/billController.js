const Bill = require('../models/Bill');
const Counter = require('../models/Counter');

// @desc    Get next upcoming bill number in order
// @route   GET /api/bills/next-number
// @access  Public
exports.getNextBillNumber = async (req, res) => {
  try {
    const nextBillNo = await Counter.peekNextBillNumber('bill_number', 'GL-');
    res.status(200).json({
      success: true,
      nextBillNo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate next bill number',
      error: error.message,
    });
  }
};

// @desc    Create and save a new Bill with atomic unique sequence
// @route   POST /api/bills
// @access  Public
exports.createBill = async (req, res) => {
  try {
    let {
      billNo,
      billDate,
      customer,
      paymentMode,
      paymentStatus,
      items,
      grossSubTotal,
      discountPercent,
      discountAmount,
      grandTotal,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill must contain at least one item',
      });
    }

    // If billNo is not provided or auto-generated, get the next sequential number atomically
    if (!billNo || billNo.trim() === '') {
      billNo = await Counter.getNextBillNumber('bill_number', 'GL-');
    } else {
      // Check if billNo already exists
      const existing = await Bill.findOne({ billNo: billNo.trim() });
      if (existing) {
        // Increment sequence to guarantee uniqueness in sequential order
        billNo = await Counter.getNextBillNumber('bill_number', 'GL-');
      }
    }

    // Compute or verify financial calculations
    const calculatedGross = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const discPct = Number(discountPercent) || 0;
    const discAmt = discPct > 0 ? (calculatedGross * discPct) / 100 : 0;
    const finalGrandTotal = Math.max(0, Math.round(calculatedGross - discAmt));
    const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);

    const newBill = new Bill({
      billNo: billNo.trim(),
      billDate: billDate || new Date().toISOString().split('T')[0],
      customer: {
        name: customer?.name || 'Walk-in Customer',
        mobile: customer?.mobile || customer?.phone || '',
        city: customer?.city || 'Modasa',
      },
      paymentMode: paymentMode || 'Cash',
      paymentStatus: paymentStatus || 'PAID',
      items: items.map((i, idx) => ({
        code: (i.code || i.itemCode || `GL-${idx + 1}`).trim(),
        company: i.company || 'GLITCH',
        category: i.category || 'T-Shirt',
        size: i.size || 'L',
        qty: Number(i.qty) || 1,
        rate: Number(i.rate) || 0,
        amount: Number(i.amount) || (Number(i.qty) || 1) * (Number(i.rate) || 0),
      })),
      totalQty,
      grossSubTotal: calculatedGross,
      discountPercent: discPct,
      discountAmount: discAmt,
      grandTotal: finalGrandTotal,
      notes: notes || '',
    });

    const savedBill = await newBill.save();

    res.status(201).json({
      success: true,
      message: 'Bill created and saved successfully',
      data: savedBill,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists. Please use a unique bill number.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to save bill',
      error: error.message,
    });
  }
};

// @desc    Get all saved bills with search & pagination
// @route   GET /api/bills
// @access  Public
exports.getAllBills = async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { billNo: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.mobile': { $regex: search, $options: 'i' } },
        { 'customer.city': { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = startDate;
      if (endDate) query.billDate.$lte = endDate;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalBills = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total: totalBills,
      page: pageNum,
      pages: Math.ceil(totalBills / limitNum),
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bills',
      error: error.message,
    });
  }
};

// @desc    Get single bill by ID or Bill Number
// @route   GET /api/bills/:id
// @access  Public
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    let bill = null;

    if (id.startsWith('GL-') || !id.match(/^[0-9a-fA-F]{24}$/)) {
      bill = await Bill.findOne({ billNo: id });
    } else {
      bill = await Bill.findById(id);
    }

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bill',
      error: error.message,
    });
  }
};

// @desc    Delete bill by ID
// @route   DELETE /api/bills/:id
// @access  Public
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    let deletedBill = null;

    if (id.startsWith('GL-') || !id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedBill = await Bill.findOneAndDelete({ billNo: id });
    } else {
      deletedBill = await Bill.findByIdAndDelete(id);
    }

    if (!deletedBill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or already deleted',
      });
    }

    res.status(200).json({
      success: true,
      message: `Bill ${deletedBill.billNo} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill',
      error: error.message,
    });
  }
};

// @desc    Get bill analytics & stats
// @route   GET /api/bills/stats/summary
// @access  Public
exports.getBillStats = async (req, res) => {
  try {
    const totalCount = await Bill.countDocuments();
    const aggregateData = await Bill.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalItemsSold: { $sum: '$totalQty' },
          avgBillValue: { $avg: '$grandTotal' },
        },
      },
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = await Bill.find({ billDate: todayStr });
    const todayRevenue = todayBills.reduce((s, b) => s + b.grandTotal, 0);

    res.status(200).json({
      success: true,
      data: {
        totalBills: totalCount,
        totalRevenue: aggregateData[0]?.totalRevenue || 0,
        totalItemsSold: aggregateData[0]?.totalItemsSold || 0,
        avgBillValue: Math.round(aggregateData[0]?.avgBillValue || 0),
        todaySales: {
          count: todayBills.length,
          revenue: todayRevenue,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
};
