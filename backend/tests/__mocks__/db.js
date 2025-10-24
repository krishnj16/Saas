const makeMockPool = () => {
  const calls = [];
  const results = [];

  return {
    __setupResults(arr) {
      results.length = 0;
      for (const r of arr) results.push(r);
    },

    __getCalls() { return calls.slice(); },

    query(text, params) {
      calls.push({ text, params });
      if (results.length) {
        const r = results.shift();
        return Promise.resolve(r);
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    },

    connect() {
      const client = {
        query: (text, params) => {
          calls.push({ text, params, via: 'client' });
          if (results.length) return Promise.resolve(results.shift());
          return Promise.resolve({ rowCount: 0, rows: [] });
        },
        release: () => {}
      };
      return Promise.resolve(client);
    },

    end() { return Promise.resolve(); }
  };
};

module.exports = makeMockPool();
