const { Client } = require('pg');

async function checkDb() {
  const client = new Client({
    host: '94.249.213.61',
    port: 5432,
    user: 'postgres',
    password: 'Iniyal@14',
    database: 'aiDev',
  });

  try {
    await client.connect();
    console.log('Connected to PG Database successfully!');

    // 1. Check custom tasks
    const customTasksRes = await client.query('SELECT custom_task_id, title, status, task_id, project_jobj_id FROM custom_tasks LIMIT 10;');
    console.log('\n--- CUSTOM TASKS ---');
    console.table(customTasksRes.rows);

    // 2. Check workers
    const workersRes = await client.query('SELECT worker_id, nickname, status, last_seen FROM workers LIMIT 10;');
    console.log('\n--- WORKERS ---');
    console.table(workersRes.rows);

    // 3. Check tasks
    const tasksRes = await client.query('SELECT task_id, worker_id, status, url FROM tasks LIMIT 10;');
    console.log('\n--- RUNNER TASKS ---');
    console.table(tasksRes.rows);

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

checkDb();
