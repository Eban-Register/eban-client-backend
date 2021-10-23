
## script generation
sequelize migration:create --name="meaningful-name"

## migrate
npm run compile
npx sequelize db:migrate

## new column
await queryInterface.addColumn('meetings', 'reminderJobId', {
  type: Sequelize.STRING,
  allowNull: true,
  //after: "id"
});

## change column
await queryInterface.changeColumn('members', 'phone', {
  type : Sequelize.STRING,
  allowNull: false,
  unique: false
});

## rename column
await queryInterface.renameColumn('my_some_table', 'totoId', 'toto_id');

## raw query
await queryInterface.sequelize.query(`
  ALTER table members 
    ALTER COLUMN address DROP NOT NULL;
`);

## remove column
await queryInterface.removeColumn(
  'meetings', 'earlyOffset');

## new table
await queryInterface.createTable('event_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      allowExit: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      organizationId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'organizations',
          },
          key: 'id'
        },
        allowNull: false
      },
      eventId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'events',
          },
          key: 'id'
        },
        allowNull: false
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });