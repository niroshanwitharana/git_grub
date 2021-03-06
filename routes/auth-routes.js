const router = require('express').Router();
const passport = require('passport');

// Auth with Google

router.get('/google', passport.authenticate('google', {
  scope: ['profile'],
}));

// Callback route for Google login

router.get('/google/redirect', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/member');
});

// Logout

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/guest');
});

module.exports = router;
