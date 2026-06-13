import Report from '../models/Report.js';

// @desc    Submit a fraud/violation report
// @route   POST /api/reports
// @access  Private
export const submitReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
      description,
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (Admin)
// @route   GET /api/admin/reports
// @access  Private (Admin only)
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email role')
      .sort('-createdAt');
      
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status (Admin)
// @route   PATCH /api/admin/reports/:id/status
// @access  Private (Admin only)
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};
