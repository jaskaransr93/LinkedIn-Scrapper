module.exports = (sequelize, DataTypes) => {
    return sequelize.define('targets', {
        source_id_c: { type: DataTypes.STRING, primaryKey: true },
        email1: DataTypes.STRING,
        email2: DataTypes.STRING,
        phone_1: DataTypes.STRING,
        phone_2: DataTypes.STRING,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        title: DataTypes.STRING,
        account_name: DataTypes.STRING,
        primary_address_street: DataTypes.STRING,
        primary_address_city: DataTypes.STRING,
        primary_address_state: DataTypes.STRING,
        primary_address_country: DataTypes.STRING,
        website: DataTypes.STRING,
        linkedin_url: { type: DataTypes.STRING },
        twitter_url: { type: DataTypes.STRING },
        connections: DataTypes.STRING
    });
};