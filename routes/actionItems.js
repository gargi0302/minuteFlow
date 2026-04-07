const router = require('express').Router();
const {
  createActionItem,
  getActionItems,
  getWorkspaceActionItems,
  updateActionItem,
  deleteActionItem,
  getMyTasks,
} = require('../controllers/actionItemController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-tasks', getMyTasks);
router.get('/meeting/:meetingId', getActionItems);
router.post('/meeting/:meetingId', createActionItem);
router.get('/workspace/:workspaceId', getWorkspaceActionItems);
router.put('/:id', updateActionItem);
router.delete('/:id', deleteActionItem);

module.exports = router;
