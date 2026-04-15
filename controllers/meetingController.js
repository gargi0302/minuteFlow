const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
const ActionItem = require('../models/ActionItem');
const { generateMoM } = require('../services/aiService');

// ── Helpers ──────────────────────────────────────────────────────────

// Safely extract an ID string whether the field is a raw ObjectId or a
// populated document (e.g. after .populate('members.user', 'name email'))
const toId = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val._id) return val._id.toString();
  return val.toString();
};

const isMember = (workspace, userId) => {
  const uid = userId.toString();
  return workspace.members.some((m) => toId(m.user) === uid);
};

const isWorkspaceAdmin = (workspace, userId) =>
  toId(workspace.createdBy) === userId.toString();

/**
 * Returns true if userId can fully open (read details of) the meeting.
 * Rules:
 *  - Workspace admin → always
 *  - Meeting creator → always
 *  - visibility === 'everyone' → always
 *  - visibility === 'restricted' + userId in allowedUserIds → yes
 */
const canAccess = (meeting, workspace, userId) => {
  const uid = userId.toString();
  if (isWorkspaceAdmin(workspace, uid)) return true;
  if (toId(meeting.createdBy) === uid) return true;
  if (meeting.visibility === 'everyone') return true;
  return meeting.allowedUserIds.some((id) => toId(id) === uid);
};

// ── Create meeting ────────────────────────────────────────────────────
const createMeeting = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (!isMember(workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { title, date, venue, attendees, agenda, visibility } = req.body;
    const meeting = await Meeting.create({
      workspace: workspace._id,
      title,
      date,
      venue,
      attendees,
      agenda,
      createdBy: req.user._id,
      visibility: visibility || 'everyone',
      // Creator is always in the allowed list (relevant when restricted)
      allowedUserIds: [req.user._id],
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all meetings in a workspace ──────────────────────────────────
// All workspace members see ALL meetings, but each has a `hasAccess` flag.
const getMeetings = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (!isMember(workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const meetings = await Meeting.find({ workspace: workspace._id })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    const uid = req.user._id;
    const result = meetings.map((m) => {
      const obj = m.toObject();
      obj.hasAccess = canAccess(m, workspace, uid);
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single meeting ────────────────────────────────────────────────
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('allowedUserIds', 'name email');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // Fetch workspace with populated members for both auth checks and UI
    const workspace = await Workspace.findById(meeting.workspace)
      .populate('members.user', 'name email');

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Must be a workspace member to even see this route
    if (!isMember(workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    // Access gate — return 403 with minimal meeting info for the denied UI
    if (!canAccess(meeting, workspace, req.user._id)) {
      return res.status(403).json({
        accessDenied: true,
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          date: meeting.date,
          visibility: meeting.visibility,
          createdBy: meeting.createdBy,
        },
      });
    }

    const actionItems = await ActionItem.find({ meeting: meeting._id });
    res.json({ meeting, actionItems, workspace });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update meeting ────────────────────────────────────────────────────
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const workspace = await Workspace.findById(meeting.workspace);
    if (!canAccess(meeting, workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const updatable = ['title', 'date', 'venue', 'attendees', 'agenda', 'decisions', 'transcript', 'status'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) meeting[field] = req.body[field];
    });
    await meeting.save();
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update access settings ────────────────────────────────────────────
// Only meeting creator or workspace admin can change visibility / allowed users.
const updateAccess = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const workspace = await Workspace.findById(meeting.workspace);
    const uid = req.user._id.toString();
    const isAdmin = isWorkspaceAdmin(workspace, uid);
    const isCreator = meeting.createdBy.toString() === uid;

    if (!isAdmin && !isCreator)
      return res.status(403).json({ message: 'Only the organizer or a workspace admin can manage access' });

    const { visibility, allowedUserIds } = req.body;

    if (visibility) meeting.visibility = visibility;

    if (allowedUserIds !== undefined) {
      // Always keep creator in the list
      const creatorId = meeting.createdBy.toString();
      const ids = Array.isArray(allowedUserIds) ? allowedUserIds.map(String) : [];
      if (!ids.includes(creatorId)) ids.push(creatorId);
      meeting.allowedUserIds = ids;
    }

    await meeting.save();

    // Return populated version for UI
    const populated = await Meeting.findById(meeting._id)
      .populate('allowedUserIds', 'name email')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Request access ────────────────────────────────────────────────────
// Placeholder — logs the request. In production this would email the organizer.
const requestAccess = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('createdBy', 'name email');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // In a real app: send email to meeting.createdBy.email
    // For now, just acknowledge the request
    res.json({
      message: `Access request sent to ${meeting.createdBy.name}`,
      organizer: meeting.createdBy.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Generate MoM ──────────────────────────────────────────────────────
const generateMeetingMoM = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const workspace = await Workspace.findById(meeting.workspace);
    if (!canAccess(meeting, workspace, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    if (!meeting.transcript || meeting.transcript.trim().length < 50)
      return res.status(400).json({ message: 'Please add a meeting transcript before generating MoM' });

    const momContent = await generateMoM({ meeting, workspace });

    meeting.mom = { content: momContent, generatedAt: new Date() };
    meeting.status = 'finalized';
    await meeting.save();

    try {
      const raw = momContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed.actionItems?.length) {
        await ActionItem.deleteMany({ meeting: meeting._id });
        const items = parsed.actionItems.map((a) => ({
          meeting: meeting._id,
          workspace: workspace._id,
          task: a.task,
          assignedTo: a.assignedTo || 'Unassigned',
          priority: ['high', 'medium', 'low'].includes(a.priority) ? a.priority : 'medium',
          status: 'pending',
        }));
        await ActionItem.insertMany(items);
      }
    } catch (_) {}

    res.json({ mom: meeting.mom });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete meeting ────────────────────────────────────────────────────
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const workspace = await Workspace.findById(meeting.workspace);
    const uid = req.user._id.toString();
    const isAdmin = isWorkspaceAdmin(workspace, uid);
    const isCreator = meeting.createdBy.toString() === uid;

    if (!isAdmin && !isCreator)
      return res.status(403).json({ message: 'Not authorized' });

    await ActionItem.deleteMany({ meeting: meeting._id });
    await meeting.deleteOne();
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  updateAccess,
  requestAccess,
  generateMeetingMoM,
  deleteMeeting,
};
