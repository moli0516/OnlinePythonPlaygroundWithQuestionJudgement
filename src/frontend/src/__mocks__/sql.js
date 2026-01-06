module.exports = async function initSqlJs() {
  return {
    Database: function () {
      return {
        run: () => {},
        exec: () => [{ columns: [], values: [] }],
        close: () => {},
      };
    },
  };
};
