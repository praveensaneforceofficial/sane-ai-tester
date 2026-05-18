require('dotenv').config();
const db = require('./src/config/database');
db.connect();

setTimeout(async () => {
    try {
        const taskId = 'CT-1779085916156';
        const timestamp = taskId.replace('CT-', '');
        console.log('Searching for timestamp:', timestamp);
        const result = await db.query('SELECT * FROM test_reports WHERE task_id LIKE $1 ORDER BY generated_at DESC', [`%${timestamp}%`]);
        console.log('Found rows:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('First row task_id:', result.rows[0].task_id);
        }
    } catch (e) {
        console.error('Error running query:', e);
    } finally {
        await db.close();
        process.exit(0);
    }
}, 2000);
