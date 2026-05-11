export const API = {
  Auth: {
    SIGNUP_URL: "/auth/signup",
    LOGIN_URL: "/auth/login",
    LOGOUT_URL: "/auth/logout",
    VERIFY_EMAIL_URL: "/auth/verify-email",
    REFRESH_TOKEN_URL: "/auth/refresh-token",
    AUTH_URL: "/auth/me",
    FORGOT_PASSWORD_URL: "/auth/forgot-password",
    RESET_PASSWORD_URL: "/auth/reset-password",
    GOOGLE_AUTH: (role: string) => `/api/v1/auth/google?role=${role}`,
  },
  USER: {
    FETCH_USER_PROFILE:  `/users/me`,
    UPDATE_USER_PROFILE: `/users/me`,
    CHANGE_PASSWORD: `/users/change-password`,
    UPDATE_PROFILE_PICTURE: `/users/profile-picture`,
    PUT_PRESIGNED_URL: "/users/s3-presigned-url",
    GET_PRESIGNED_URL: "/users/s3-getPresigned-url",
    UPDATE_MENTOR_PROFILE: `/users/mentor-profile`,
    UPDATE_PROFILE_DATA: (userId: string) => `/users/${userId}/profile-data`,
    GET_USER_PROFILE: (userId: string) => `/users/${userId}/profile`,
  },
  SHARED: {
    UPLOAD_PUT_PRESIGNED_URL: "/shared/s3/presigned-url/upload",
    DOWNLOAD_GET_PRESIGNED_URL: "/shared/s3/presigned-url/download",
  },
  ADMIN: {
    FETCH_ALL_USERS: "/admin/users",
    GET_USER_PROFILE: (userId: string) => `/admin/users/${userId}`,
    BLOCK_USER: (userId: string) => `/admin/users/${userId}/block`,
    APPROVE_MENTOR: (userId: string) => `/admin/users/${userId}/approve`,
    DASHBOARD_CARD: `/admin/dashboard/cards`,
  },
  CATEGORY: {
    CREATE_CATEGORY: `/categories`,
    LIST_CATEGORIES: `/categories`,
    EDIT_CATEGORY: (categoryId: string) => `/categories/${categoryId}`,
  },
  COURSE: {
    CREATE_COURSE: "/courses",
    FETCH_COURSES: "/courses",
    ADD_OR_UPDATE_SESSION: (courseId: string, updatePart: string) =>
      `/courses/${courseId}?course_part=${updatePart}`,
    GET_COURSE: (courseId: string) => `/courses/${courseId}`,
    GET_MENTOR_DRAFTED_COURSE: `/courses/my-courses`,
    ADD_SESSION: (sessionId: string) => `/courses/${sessionId}/sessions`,
    ADD_LECTURE: (courseId: string, sessionId: string) =>
      `/courses/${courseId}/sessions/${sessionId}`,
    EDIT_LECTURE: (courseId: string, sessionId: string, lectureId: string) =>
      `/courses/${courseId}/sessions/${sessionId}/lectures/${lectureId}`,
    UPDATE_BASE_COURSE_INFO: (courseId: string) => `/courses/${courseId}`,
    PUBLISH_COURSE: (courseId: string) => `/courses/publish/${courseId}`,
    ADMIN_COURSE_LIST: "/courses/admin-courses",
    COURSE_DETAILS: (courseId: string) => `/courses/${courseId}`,
    COURSE_DETAILS_ADMIN: (courseId: string) => `/courses/${courseId}/admin`,
    APPROVE_CURSE: (courseId: string) => `/courses/admin/approve/${courseId}`,
    REJECT_COURSE: (courseId: string) => `/courses/admin/reject/${courseId}`,
    LIST_COURSE_FOR_SLOT:  `/courses/mentor`,
    GET_COURSE_FORM_DATA: (courseId: string) => `/courses/form/${courseId}`,
    UPDATE_SESSION: (courseId: string, sessionId: string) =>
      `/courses/${courseId}/session/${sessionId}`,
    DELETE_SESSION: (courseId: string, sessionId: string) =>
      `/courses/${courseId}/session/${sessionId}`,
    DELETE_LECTURE: (courseId: string, sessionId: string, lectureId: string) =>
      `/courses/${courseId}/session/${sessionId}/lecture/${lectureId}`,
  },
  PAYMENT: {
    CREATE_PAYMENT_INTENT: "/orders/payment/create-checkout-session",
    GET_PAYMENT_DATA: (sessionsId: string) => `/orders/stripe/${sessionsId}`,
    TRANSACTION_HISTORY:'/orders/payment/transaction'
  },
  ENROLLEMENT: {
    GET_ENROLLED_COURSE:  `/enrollements`,
    GET_ENROLLD_COURSE_DETAILS: (enrolledId: string) =>
      `/enrollements/course/${enrolledId}`,
    UPDATE_PROGRESS: (enrolledId: string) => `/enrollements/${enrolledId}`,
    ADD_RATING: (enrolledId: string) => `/enrollements/${enrolledId}/rating`,
    GET_COURSE_DASHBOARD: (courseId: string) =>
      `/enrollements/course/${courseId}/mentor`,
    GET_FILTERED_GRAPH: (courseId: string) =>
      `/enrollements/course/${courseId}/chart`,
    GET_MENTOR_DASH_DATA: 
      `/enrollements/mentor/dashboard`,
    GET_REVANUE_GRAPH: `/enrollements/mentor/dashboard/revanue`,
    GET_ADMIN_REVANUE_GRAPH: `/enrollements/admin/dashboard/revanue`,
  },
  REVIEW: {
    ADD_REVIEW: "/reviews/",
    GET_REVIEWS: (courseId: string) => `/reviews/${courseId}`,
  },
  NOTIFICATION: {
    GET_NOTIFICATION: (userId: string) => `/notifications/${userId}`,
    READ_NOTIFICATION: (notifyId: string) => `/notifications/${notifyId}`,
  },
  CHAT: {
    CREATE_CHAT: `/chats/get-or-create`,
    LIST_USERS: (senderId: string) => `/chats/users/${senderId}`,
    GET_MESSAGE: (chatId: string, limit = 30) =>
      `/chats/${chatId}/messages?limit=${limit}`,
  },
  SLOTS: {
    CREATE_SLOTS: `/slots/create`,
    GET_MENTOR_SLOTS: (mentorId: string) => `/slots/${mentorId}`,
    UPDATE_SLOT: (slotId: string) => `/slots/${slotId}`,
    GET_COURSE_SLOT: (courseId: string) => `/slots/course/${courseId}`,
  },
  SLOT_BOOK: {
    BOOK_SLOT: `/slot-booking/create`,
    ListeUserBooking: (learnerId: string) =>
      `/slot-booking/learner/${learnerId}`,
    ListeMentorBooking: (mentorId: string) =>
      `/slot-booking/mentor/${mentorId}`,
    UPDATE_BOOKINGL: (slotId: string) => `/slot-booking/${slotId}`,
    UPDATE_STUDENT_STATUS: (slotbookingId: string) =>
      `/slot-booking/${slotbookingId}/student-status`,
    UPDATE_BOOKED_SLOT_STATUS: (bookedId: string) =>
      `/slot-booking/${bookedId}/slot-status`,
    CANCEL_BOOKED_SLOT: (bookedId: string) =>
      `/slot-booking/${bookedId}/cancel`,
  },
  VIDEO: {
    START_VIDEO: (bookingId: string) => `/video/start/${bookingId}`,
  },
  CERTIFICATE: {
    create: `/certificate`,
    list_Certificate: (learnerId: string) =>
      `/certificate/my-certificate/${learnerId}`,
  },
  LEARNER: {
    LEARNER_DASHBOARD: 
      `/enrollements/learner/dashboard`,
  },
  CHAT_BOT:{
      FETCH_MESSAGE:(learnerId:string,courseId:string)=>`/chat-bot/learner/${learnerId}/course/${courseId}`,
      createChat:'/chat-bot/'
  }
};
