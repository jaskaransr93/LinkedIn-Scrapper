module.exports = (sequelize, DataTypes) => {
    return sequelize.define('connection_nodes', {
        profile_id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
        },
        group: { type: DataTypes.INTEGER }
    });    
};