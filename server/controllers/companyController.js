const Company = require('../models/Company');

const DEFAULT_COMPANIES = [
  { name: 'GLITCH', code: 'GL', description: 'Official In-house Gen-Z Menswear Brand', order: 1 },
  { name: 'ZARA', code: 'ZR', order: 2 },
  { name: 'H&M', code: 'HM', order: 3 },
  { name: 'SNITCH', code: 'SN', order: 4 },
  { name: 'LEVIS', code: 'LV', order: 5 },
  { name: 'OFF-WHITE', code: 'OW', order: 6 },
  { name: 'BALENCIAGA', code: 'BL', order: 7 },
  { name: 'PUMA', code: 'PM', order: 8 },
  { name: 'NIKE', code: 'NK', order: 9 },
  { name: 'ADIDAS', code: 'AD', order: 10 },
  { name: 'POWERLOOK', code: 'PL', order: 11 },
  { name: 'THE SOULS', code: 'TS', order: 12 },
  { name: 'JACK & JONES', code: 'JJ', order: 13 },
  { name: 'US POLO', code: 'USP', order: 14 },
  { name: 'OVERSIZED CLUB', code: 'OC', order: 15 },
  { name: 'OTHER BRAND', code: 'OTH', order: 99 },
];

// @desc    Get all companies (auto-seeds defaults if collection is empty)
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    let count = await Company.countDocuments();
    if (count === 0) {
      await Company.insertMany(DEFAULT_COMPANIES);
    }

    const companies = await Company.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve companies',
      error: error.message,
    });
  }
};

// @desc    Add a new company brand
// @route   POST /api/companies
// @access  Public
exports.createCompany = async (req, res) => {
  try {
    const { name, code, description, order } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const existing = await Company.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Company with this name already exists' });
    }

    const newCompany = await Company.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : name.substring(0, 3).toUpperCase(),
      description: description || '',
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Company added successfully',
      data: newCompany,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add company',
      error: error.message,
    });
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Public
exports.updateCompany = async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update company', error: error.message });
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Public
exports.deleteCompany = async (req, res) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete company', error: error.message });
  }
};
