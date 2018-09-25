module.exports = (sequelize, DataTypes) => {
    return sequelize.define('recommendation_given', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        profile_name: DataTypes.STRING,
        profile_url: { type: DataTypes.STRING, primaryKey: true },
        text: DataTypes.TEXT
    });
};