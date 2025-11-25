export const poll = async ({ fn, validate, interval, maxAttempts }) => {
  let attempts = 0;

  const executePoll = async (resolve, reject) => {
    try {
      const result = await fn();
      attempts++;

      if (validate(result)) {
        return resolve(result);
      }

      if (maxAttempts && attempts === maxAttempts) {
        return reject(new Error('Exceeded max attempts'));
      }

      setTimeout(executePoll, interval, resolve, reject);
    } catch (e) {
      reject(e);
    }
  };

  return new Promise(executePoll);
};