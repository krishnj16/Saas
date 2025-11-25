const path = require('path');
const loggerPath = path.join(__dirname, '..', 'backend', 'services', 'logger');

try {
  global.logger = require(loggerPath);
} catch (err) {
  global.logger = {
    info: (...args) => {  },
    warn: (...args) => { },
    error: (...args) => {  },
    debug: (...args) => {  }
  };
}
