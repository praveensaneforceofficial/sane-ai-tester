const Joi = require('joi');

const workerRegistrationSchema = Joi.object({
    machineId: Joi.string().required(),
    nickname: Joi.string().min(3).max(50).required(),
    ip: Joi.string().ip().required(),
    os: Joi.string().valid('win32', 'linux', 'darwin').required()
});

const taskSchema = Joi.object({
    workerId: Joi.string().required(),
    url: Joi.string().uri().required(),
    prompt: Joi.string().optional()
});

const statusUpdateSchema = Joi.object({
    action: Joi.string().valid('active', 'offline', 'remove').required()
});

function validateWorkerRegistration(data) {
    return workerRegistrationSchema.validate(data);
}

function validateTask(data) {
    return taskSchema.validate(data);
}

function validateStatusUpdate(data) {
    return statusUpdateSchema.validate(data);
}

module.exports = {
    validateWorkerRegistration,
    validateTask,
    validateStatusUpdate
};