# VolleyApp - Deployment Checklist

## Pre-Deployment

### Google Cloud Setup
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins configured:
  - [ ] http://godeliauskas.com
  - [ ] http://www.godeliauskas.com
  - [ ] https://godeliauskas.com (if using SSL)
  - [ ] https://www.godeliauskas.com (if using SSL)
- [ ] Client ID copied and saved

### Database Setup
- [ ] MySQL database created
- [ ] Database credentials documented
- [ ] `database.sql` imported successfully
- [ ] Tables verified (users, events, registrations)
- [ ] First event added with correct date
- [ ] Database connection tested

### File Configuration
- [ ] `api.php` - DB credentials updated
- [ ] `api.php` - Error reporting configured for production
- [ ] `index.html` - Google Client ID updated (2 places)
- [ ] `.htaccess` - Reviewed and customized if needed

## Deployment

### FTP Upload
- [ ] Connected to FTP server
- [ ] `/volley/` directory created
- [ ] Files uploaded:
  - [ ] index.html
  - [ ] api.php
  - [ ] .htaccess
- [ ] File permissions set correctly:
  - [ ] Files: 644 (rw-r--r--)
  - [ ] Directories: 755 (rwxr-xr-x)

### Initial Testing
- [ ] Site loads: http://godeliauskas.com/volley/
- [ ] Event date displays correctly
- [ ] Google Sign-In button appears
- [ ] No JavaScript errors in console (F12)
- [ ] No PHP errors visible

## Post-Deployment Testing

### Functionality Tests
- [ ] **Google Login**
  - [ ] Sign in with Google works
  - [ ] User name displays in header
  - [ ] Session persists on page reload
  
- [ ] **Registration**
  - [ ] "DALYVAUTI" button appears when logged in
  - [ ] Registration works
  - [ ] User appears in players list
  - [ ] User's name is highlighted/bold
  - [ ] Button changes to "NEBEŽAISIU"
  
- [ ] **Unregistration**
  - [ ] "NEBEŽAISIU" button works
  - [ ] User removed from list
  - [ ] Button changes back to "DALYVAUTI"
  
- [ ] **Logout**
  - [ ] Logout button works
  - [ ] Session cleared
  - [ ] Redirected to login state
  
- [ ] **Live Updates**
  - [ ] Open in two browsers/devices
  - [ ] Register in one browser
  - [ ] Verify update appears in other browser within 10 seconds
  - [ ] Player count updates correctly

### Cross-Browser Testing
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)

### Responsive Design
- [ ] Mobile (320px - 480px)
- [ ] Tablet (481px - 768px)
- [ ] Desktop (769px+)
- [ ] All elements visible and functional
- [ ] No horizontal scrolling
- [ ] Buttons easily tappable on mobile

## Security Hardening

### Production Settings
- [ ] PHP error display disabled in `api.php`:
  ```php
  error_reporting(0);
  ini_set('display_errors', 0);
  ```
- [ ] Error logging enabled and path configured
- [ ] `.htaccess` security headers active
- [ ] Database credentials not exposed in client-side code

### SSL/HTTPS (Recommended)
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled in `.htaccess`
- [ ] Google OAuth origins updated for HTTPS
- [ ] Mixed content warnings resolved
- [ ] All resources loaded over HTTPS

### Database Security
- [ ] Database user has minimal required privileges
- [ ] Database password is strong
- [ ] Remote database access restricted (if applicable)
- [ ] Regular backups configured

## Monitoring & Maintenance

### Setup Monitoring
- [ ] PHP error log location identified
- [ ] MySQL slow query log enabled (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Google Analytics added (optional)

### Backup Strategy
- [ ] Database backup script created
- [ ] Backup schedule defined (daily/weekly)
- [ ] Backup restoration tested
- [ ] File backups included

### Documentation
- [ ] Admin credentials documented securely
- [ ] Database credentials documented securely
- [ ] Google OAuth credentials documented
- [ ] FTP credentials documented securely
- [ ] Emergency contacts listed

## User Management

### Admin Setup
- [ ] Admin user identified
- [ ] Admin flag set in database:
  ```sql
  UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';
  ```
- [ ] Admin capabilities tested (if implemented)

### Event Management
- [ ] Process for adding new events documented
- [ ] Responsible person assigned
- [ ] Reminder system for adding future Saturdays
- [ ] Old event cleanup strategy defined

## Performance Optimization

### Caching
- [ ] Browser caching configured in `.htaccess`
- [ ] Static assets cached appropriately
- [ ] Database query performance acceptable

### Loading Speed
- [ ] Page load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] No unnecessary external resources
- [ ] Images optimized (if any added later)

## Launch Preparation

### Communication
- [ ] Launch date set
- [ ] Users notified about new system
- [ ] Instructions/tutorial prepared
- [ ] Support channel established (email/phone)

### Rollback Plan
- [ ] Previous system (if any) still accessible
- [ ] Rollback procedure documented
- [ ] Database backup before launch
- [ ] File backup before launch

## Post-Launch

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check user registrations
- [ ] Verify live updates working
- [ ] Respond to user feedback
- [ ] Fix critical issues immediately

### First Week
- [ ] Collect user feedback
- [ ] Monitor usage patterns
- [ ] Identify pain points
- [ ] Plan improvements
- [ ] Update documentation as needed

### Ongoing
- [ ] Weekly event additions
- [ ] Monthly database cleanup
- [ ] Quarterly security review
- [ ] Regular backups verified
- [ ] User satisfaction monitored

## Success Metrics

### Technical Metrics
- [ ] Uptime > 99%
- [ ] Page load time < 3s
- [ ] Zero critical errors
- [ ] All features working

### User Metrics
- [ ] User registration rate
- [ ] Active users per event
- [ ] User retention
- [ ] Positive feedback

## Notes

Date deployed: _______________
Deployed by: _______________
Version: 1.0 MVP

Issues encountered:
_________________________________
_________________________________
_________________________________

Resolutions:
_________________________________
_________________________________
_________________________________

## Sign-Off

- [ ] Technical lead approval
- [ ] Stakeholder approval
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Ready for production

Approved by: _______________
Date: _______________
Signature: _______________
