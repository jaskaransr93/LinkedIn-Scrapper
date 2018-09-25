module.exports = (sequelize, DataTypes) => {
    return sequelize.define('profile', {
        profile_id: { type: DataTypes.STRING, primaryKey: true },
        name: DataTypes.STRING,
        title: DataTypes.STRING,
        location: DataTypes.STRING,
        current_employement: DataTypes.STRING,
        linkedin_url: { type: DataTypes.STRING },
        twitter_url: { type: DataTypes.STRING },
        connections: DataTypes.STRING
    });
};