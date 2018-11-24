module.exports = (sequelize, DataTypes) => {
    return sequelize.define('text_count', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        keyword: { type: DataTypes.STRING, primaryKey: true },
        count: DataTypes.INTEGER
    });
};