const ActionItem = require('../models/ActionItem');
const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');

const isMember = (workspace, userId) =>
  workspace.members.some((m) => m.user.toString() === userId.toString());

// Create action item
const createActionItem = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const workspace = await Workspace.findById(meeting.workspace);
    if (!isMember(workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { task, assignedTo, dueDate, priority } = req.body;
    const actionItem = await ActionItem.create({
      meeting: meeting._id,
      workspace: workspace._id,
      task,
      assignedTo,
      dueDate,
      priority,
    });
    res.status(201).json(actionItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all action items for a meeting
const getActionItems = async (req, res) => {
  try {
    const actionItems = await ActionItem.find({ meeting: req.params.meetingId });
    res.json(actionItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all action items for a workspace
const getWorkspaceActionItems = async (req, res) => {
  try {
    const actionItems = await ActionItem.find({ workspace: req.params.workspaceId })
      .populate('meeting', 'title date')
      .sort({ dueDate: 1 });
    res.json(actionItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update action item status
const updateActionItem = async (req, res) => {
  try {
    const actionItem = await ActionItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actionItem) return res.status(404).json({ message: 'Action item not found' });
    res.json(actionItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete action item
const deleteActionItem = async (req, res) => {
  try {
    await ActionItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Action item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all action items across all workspaces the user belongs to
const getMyTasks = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id });
    const workspaceIds = workspaces.map((w) => w._id);
    const tasks = await ActionItem.find({ workspace: { $in: workspaceIds } })
      .populate('meeting', 'title date')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createActionItem, getActionItems, getWorkspaceActionItems, updateActionItem, deleteActionItem, getMyTasks };
