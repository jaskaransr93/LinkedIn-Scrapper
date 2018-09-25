module.exports = (sequelize, DataTypes) => {
    return sequelize.define('phone_numbers', {
        profile_id: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.profile,
                key: 'profile_id'
            },
            primaryKey: true
        },
        phone_number: { type: DataTypes.STRING, primaryKey: true }
    });    
};