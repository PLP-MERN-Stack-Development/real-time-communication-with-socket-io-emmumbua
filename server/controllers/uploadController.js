const path = require('path');

// @desc    Handle file uploads (handled by multer middleware)
// @route   POST /api/uploads
// @access  Private
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const baseUrl =
    process.env.SERVER_URL ||
    `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  return res.status(201).json({
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    url: fileUrl.replace(/([^:]\/)\/+/g, '$1'),
    storedFileName: req.file.filename,
    extension: path.extname(req.file.originalname),
  });
};

module.exports = { uploadFile };

