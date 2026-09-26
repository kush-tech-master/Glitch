const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Shirt', code: 'SHR', order: 1 },
  { name: 'T-Shirt', code: 'TSH', order: 2 },
  { name: 'Oversized T-Shirt', code: 'OV-TSH', order: 3 },
  { name: 'Pant', code: 'PNT', order: 4 },
  { name: 'Jeans', code: 'JNS', order: 5 },
  { name: 'Cargo Pant', code: 'CRG', order: 6 },
  { name: 'Baggy Pant', code: 'BAG-PNT', order: 7 },
  { name: 'Parachute Cargo', code: 'PAR-CRG', order: 8 },
  { name: 'Hoodie', code: 'HOD', order: 9 },
  { name: 'Sweatshirt', code: 'SWT', order: 10 },
  { name: 'Jacket / Varsity', code: 'JKT', order: 11 },
  { name: 'Boxy Cropped Shirt', code: 'BOX-SHR', order: 12 },
  { name: 'Shorts', code: 'SHT', order: 13 },
  { name: 'Track Pant', code: 'TRK-PNT', order: 14 },
  { name: 'Kurta / Ethnic', code: 'KRT', order: 15 },
  { name: 'Dress / Combo', code: 'DRS', order: 16 },
  { name: 'Accessories', code: 'ACC', order: 17 },
];

// @desc    Get all categories (auto-seeds defaults if collection is empty)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    let count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message,
    });
  }
};

// @desc    Add a new product category
// @route   POST /api/categories
// @access  Public
exports.createCategory = async (req, res) => {
  try {
    const { name, code, gender, order } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : name.substring(0, 3).toUpperCase(),
      gender: gender || 'Men',
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public
exports.updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Public
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};
