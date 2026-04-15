const router = require('express').Router();
const {
  createWorkspace,
  joinWorkspace,
  getMyWorkspaces,
  getWorkspace,
  deleteWorkspace,
  getDashboardStats,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyWorkspaces);
router.get('/dashboard/stats', getDashboardStats);
router.post('/', createWorkspace);
router.post('/join', joinWorkspace);
router.get('/:id', getWorkspace);
router.delete('/:id', deleteWorkspace);

module.exports = router;
