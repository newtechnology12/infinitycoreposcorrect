const activity_logs = [
  {
    title: "User Login Attempt",
    event_type: "USER_LOGIN_ATTEMPT",
    details: "User attempted to log in with username: {username}",
    log_level: "INFO",
  },
  {
    title: "User Login Success",
    event_type: "USER_LOGIN_SUCCESS",
    details: "User {username} logged in successfully",
    log_level: "INFO",
  },
  {
    title: "User Login Failure",
    event_type: "USER_LOGIN_FAILURE",
    details: "Failed login attempt for username: {username}",
    log_level: "WARNING",
  },
  {
    title: "User Logout",
    event_type: "USER_LOGOUT",
    details: "User {username} logged out",
    log_level: "INFO",
  },
  {
    title: "Password Change",
    event_type: "PASSWORD_CHANGE",
    details: "User {username} changed their password",
    log_level: "INFO",
  },
  {
    title: "Password Reset Request",
    event_type: "PASSWORD_RESET_REQUEST",
    details: "Password reset requested for user with email: {email}",
    log_level: "INFO",
  },
  {
    title: "Password Reset Success",
    event_type: "PASSWORD_RESET_SUCCESS",
    details: "Password reset successful for user with email: {email}",
    log_level: "INFO",
  },
  {
    title: "Password Reset Failure",
    event_type: "PASSWORD_RESET_FAILURE",
    details: "Password reset failed for user with email: {email}",
    log_level: "WARNING",
  },
];
