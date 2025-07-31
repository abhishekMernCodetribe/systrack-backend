import Log from './Log.js';

export const logAction = async({actionType, entity, entityId, performedBy, details = {}}) => {
    try {
        await Log.create({
            actionType,
            entity,
            entityId,
            performedBy,
            details
        });
    } catch (error) {
        console.error("Failed to create log: ", error.message);
    }
}

export default logAction;