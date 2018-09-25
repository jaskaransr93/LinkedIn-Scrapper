module.exports = (sequelize, DataTypes) => {
    return sequelize.define('emails', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        email: { type: DataTypes.STRING, primaryKey: true }
    });   
};