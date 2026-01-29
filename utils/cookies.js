const isProd = process.env.NODE_ENV === 'production';

const refreshCookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, 
  path: '/', 
};

const csrfCookieOpts = {
  httpOnly: false,      
  secure: isProd,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = { refreshCookieOpts, csrfCookieOpts };
