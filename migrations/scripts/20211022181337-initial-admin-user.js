'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
    INSERT INTO users ("username", "password", "createdAt", "updatedAt") VALUES ('admin', '$2b$10$mgWCcdpBqIipwveeVpZeOe/JSXqj7.wjhb3ZK7ySsd0iHwto.y4.C', '2021-10-22 11:11:03.086+00', '2021-10-22 11:11:49.054+00');`);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
