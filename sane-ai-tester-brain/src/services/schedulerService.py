from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()

def start_scheduler():
    """Start all scheduled jobs"""
    
    # Import job functions here to avoid circular imports
    from scheduler.jobs.zoho_poller import poll_zoho_sprint
    from scheduler.jobs.worker_health import check_worker_health
    from scheduler.jobs.task_retrier import retry_failed_tasks
    from scheduler.jobs.analytics_updater import update_analytics
    from scheduler.jobs.orchestrator_job import run_orchestration
    
    # Disable auto polling for Zoho
    # scheduler.add_job(
    #     func=poll_zoho_sprint,
    #     trigger=IntervalTrigger(seconds=settings.ZOHO_POLL_INTERVAL),
    #     id='zoho_poller',
    #     name='Poll Zoho Sprint for updates',
    #     replace_existing=True
    # )
    
    scheduler.add_job(
        func=check_worker_health,
        trigger=IntervalTrigger(seconds=settings.WORKER_HEALTH_INTERVAL),
        id='worker_health',
        name='Check worker health',
        replace_existing=True
    )
    
    scheduler.add_job(
        func=retry_failed_tasks,
        trigger=IntervalTrigger(seconds=settings.TASK_RETRY_INTERVAL),
        id='task_retrier',
        name='Retry failed tasks',
        replace_existing=True
    )
    
    scheduler.add_job(
        func=update_analytics,
        trigger=IntervalTrigger(minutes=5),
        id='analytics_updater',
        name='Update analytics data',
        replace_existing=True
    )

    scheduler.add_job(
        func=run_orchestration,
        trigger=IntervalTrigger(seconds=60),
        id='ai_orchestration',
        name='Automated AI Orchestration',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started with all jobs")

def stop_scheduler():
    """Stop all scheduled jobs"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

def get_jobs():
    """Get list of scheduled jobs"""
    return scheduler.get_jobs()