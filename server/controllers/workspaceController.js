const Workspace = require('../models/Workspace');
const Meeting = require('../models/Meeting');
const ActionItem = require('../models/ActionItem');
const User = require('../models/User');

// Create workspace
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { workspaces: workspace._id } });
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Join workspace by code
const joinWorkspace = async (req, res) => {
  try {
    const { code } = req.body;
    const workspace = await Workspace.findOne({ code });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    workspace.members.push({ user: req.user._id, role: 'member' });
    await workspace.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { workspaces: workspace._id } });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all workspaces for current user
const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single workspace
const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Access denied' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete workspace (admin only)
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only admin can delete workspace' });

    await ActionItem.deleteMany({ workspace: workspace._id });
    await Meeting.deleteMany({ workspace: workspace._id });
    await workspace.deleteOne();
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard stats across all user workspaces
const getDashboardStats = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id });
    const workspaceIds = workspaces.map((w) => w._id);

    const [meetings, actionItems] = await Promise.all([
      Meeting.find({ workspace: { $in: workspaceIds } })
        .populate('workspace', 'name')
        .sort({ date: -1 }),
      ActionItem.find({ workspace: { $in: workspaceIds } }),
    ]);

    const recentMeetings = meetings.slice(0, 5);
    const pendingCount = actionItems.filter((a) => a.status !== 'completed').length;
    const momCount = meetings.filter((m) => m.status === 'finalized').length;

    res.json({
      totalWorkspaces: workspaces.length,
      totalMeetings: meetings.length,
      momGenerated: momCount,
      pendingActionItems: pendingCount,
      recentMeetings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createWorkspace, joinWorkspace, getMyWorkspaces, getWorkspace, deleteWorkspace, getDashboardStats };
