module.exports = (sequelize, DataTypes) => {
    return sequelize.define('websites', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        url: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        type: DataTypes.STRING
    });
};