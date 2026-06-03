import dotenv from "dotenv";
dotenv.config();

export const env = {
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },
  get port() {
    return process.env.PORT ?? "4000";
  },
  get MONGO_URL() {
    return process.env.MONGO_URL;
  },
  get CLIENT_ORGIN() {
    return process.env.CLIENT_ORIGIN;
  },
  get EMAIL() {
    return process.env.Email;
  },
  get PASS_KEY() {
    return process.env.passKey;
  },
  get ACCESS_TOKEN() {
    return process.env.ACCESS_TOKEN;
  },
  get REFRESH_TOKEN() {
    return process.env.REFRESH_TOKEN;
  },
  get CLIENT_ID() {
    return process.env.CLIENT_ID;
  },
  get CLIENT_SECRET() {
    return process.env.CLIENT_SECRET;
  },
  get CALLBACK_URL() {
    return process.env.CALLBACK_URL;
  },
  get SESSION_SECRET() {
    return process.env.SESSION_SECRET;
  },
  get AWS_S3_ACCESS_KEY() {
    return process.env.AWS_S3_ACCESS_KEY;
  },
  get AWS_S3_SECRET_KEY() {
    return process.env.AWS_S3_SECRET_KEY;
  },
  get AWS_S3_REGION() {
    return process.env.AWS_S3_REGION;
  },
  get AWS_s3_BUCKET_NAME() {
    return process.env.AWS_S3_BUCKET_NAME;
  },
  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get WEB_HOOK_SECRETE_KEY() {
    return process.env.WEB_HOOK_SECRET_KEY;
  },
  get ACCESS_TOKEN_MAX_AGE_TIME() {
    return process.env.ACCESS_TOKEN_MAX_AGE;
  },
  get LOGGER_MAX_SIZE() {
    return process.env.LOGGER_MAX_SIZE;
  },
  get LOGGER_MAX_FILES() {
    return process.env.LOGGER_MAX_FILES;
  },
  get ADMIN_SHARE() {
    return process.env.ADMIN_SHARE;
  },
  get MENTOR_SHARE() {
    return process.env.MENTOR_SHARE;
  },
  get S3_Bucket_URL_EXPIRE_IN() {
    return process.env.S3_Bucket_URL_EXPIRE_IN;
  },
  get HASH_SALT() {
    return process.env.SALT;
  },
  get REDIS_URL() {
    return process.env.REDIS_URL;
  },
  get EARLY_JOIN_BUFFER() {
    return process.env.EARLY_JOIN_BUFFER;
  },
  get REDIS_HOST() {
    return process.env.REDIS_HOST;
  },
  get REDIS_PORT() {
    return process.env.REDIS_PORT;
  },
  get REDIS_PASS_KEY() {
    return process.env.REDIS_PASS_KEY;
  },
  get CLIENT_URL_2() {
    return process.env.CLIENT_URL_2;
  },
  get ACCESS_TOKEN_MAX_AGE() {
    return process.env.ACCESS_TOKEN_MAX_AGE;
  },
  get REFRESH_TOKEN_MAX_AGE() {
    return process.env.REFRESH_TOKEN_MAX_AGE;
  },
  get GEMINI_API_KEY() {
    return process.env.GEMINI_API_KEY;
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY;
  },
  get ENABLE_EMAIL_DELIVERY() {
    return process.env.ENABLE_EMAIL_DELIVERY;
  },
};
