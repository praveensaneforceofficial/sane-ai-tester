const db = require('./src/config/database');

async function resetTask() {
    try {
        await db.connect();
        const result = await db.query(
            "UPDATE custom_tasks SET task_id = NULL, status = 'Testing Going' WHERE custom_task_id = 'CT-1779031690538' RETURNING *"
        );
        console.log('✅ Custom Task successfully reset:', result.rows[0]);
    } catch (err) {
        console.error('❌ Failed to reset task:', err);
    } finally {
        process.exit(0);
    }
}

resetTask();
