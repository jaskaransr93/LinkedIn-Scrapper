module.exports = (sequelize, DataTypes) => {
    return sequelize.define('links', {
        source: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        target: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        value: { type: DataTypes.STRING }
    });    
};