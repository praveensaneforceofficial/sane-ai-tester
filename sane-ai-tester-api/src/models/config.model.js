class ConfigModel {
    constructor(data) {
        this.id = data.id;
        this.configKey = data.config_key;
        this.configValue = data.config_value;
        this.configType = data.config_type;
        this.description = data.description;
        this.updatedBy = data.updated_by;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            config_key: this.configKey,
            config_value: this.configValue,
            config_type: this.configType,
            description: this.description,
            updated_by: this.updatedBy,
            updated_at: this.updatedAt
        };
    }
}

module.exports = ConfigModel;
