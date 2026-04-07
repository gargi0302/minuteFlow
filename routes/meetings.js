const router = require('express').Router();
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  updateAccess,
  requestAccess,
  generateMeetingMoM,
  deleteMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/workspace/:workspaceId', getMeetings);
router.post('/workspace/:workspaceId', createMeeting);
router.get('/:id', getMeeting);
router.put('/:id', updateMeeting);
router.put('/:id/access', updateAccess);
router.post('/:id/request-access', requestAccess);
router.post('/:id/generate-mom', generateMeetingMoM);
router.delete('/:id', deleteMeeting);

module.exports = router;
