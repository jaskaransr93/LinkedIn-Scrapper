module.exports = (sequelize, DataTypes) => {
    return sequelize.define('skills', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        skill: { type: DataTypes.STRING, primaryKey: true },
        endorsed: DataTypes.STRING
    });
};