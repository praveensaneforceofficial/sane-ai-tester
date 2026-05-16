from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class SchedulerManager:
    """Manage all scheduled jobs"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.jobs = {}
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("✅ Scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Scheduler stopped")
    
    def add_interval_job(self, func, seconds: int, job_id: str, **kwargs):
        """Add interval-based job"""
        if job_id in self.jobs:
            self.remove_job(job_id)
        
        job = self.scheduler.add_job(
            func,
            trigger=IntervalTrigger(seconds=seconds),
            id=job_id,
            replace_existing=True,
            **kwargs
        )
        self.jobs[job_id] = job
        logger.info(f"Added interval job '{job_id}' every {seconds}s")
        return job
    
    def add_cron_job(self, func, cron_expr: str, job_id: str, **kwargs):
        """Add cron-based job"""
        if job_id in self.jobs:
            self.remove_job(job_id)
        
        parts = cron_expr.split()
        if len(parts) == 5:
            minute, hour, day, month, day_of_week = parts
            job = self.scheduler.add_job(
                func,
                trigger=CronTrigger(
                    minute=minute, hour=hour, day=day,
                    month=month, day_of_week=day_of_week
                ),
                id=job_id,
                replace_existing=True,
                **kwargs
            )
        else:
            raise ValueError(f"Invalid cron expression: {cron_expr}")
        
        self.jobs[job_id] = job
        logger.info(f"Added cron job '{job_id}' with schedule '{cron_expr}'")
        return job
    
    def remove_job(self, job_id: str):
        """Remove a job"""
        if job_id in self.jobs:
            self.scheduler.remove_job(job_id)
            del self.jobs[job_id]
            logger.info(f"Removed job '{job_id}'")
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get job status"""
        if job_id in self.jobs:
            job = self.jobs[job_id]
            return {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time,
                "pending": job.pending
            }
        return None
    
    def list_jobs(self) -> List[Dict]:
        """List all jobs"""
        return [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time,
                "pending": job.pending
            }
            for job in self.scheduler.get_jobs()
        ]

# Singleton instance
scheduler_manager = SchedulerManager()