#!/usr/bin/env python3
"""Build React dashboard and copy to static folder"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logger import get_logger

logger = get_logger(__name__)

def build_dashboard():
    """Build React dashboard"""
    dashboard_dir = Path(__file__).parent.parent / "dashboard"
    static_dir = Path(__file__).parent.parent / "src" / "static"
    
    if not dashboard_dir.exists():
        logger.error(f"Dashboard directory not found: {dashboard_dir}")
        return False
    
    # Clean old build
    if static_dir.exists():
        shutil.rmtree(static_dir)
        logger.info("Cleaned old static files")
    
    # Install dependencies if needed
    node_modules = dashboard_dir / "node_modules"
    if not node_modules.exists():
        logger.info("Installing npm dependencies...")
        result = subprocess.run(["npm", "install"], cwd=dashboard_dir, capture_output=True)
        if result.returncode != 0:
            logger.error(f"npm install failed: {result.stderr.decode()}")
            return False
    
    # Build the dashboard
    logger.info("Building React dashboard...")
    result = subprocess.run(["npm", "run", "build"], cwd=dashboard_dir, capture_output=True)
    
    if result.returncode != 0:
        logger.error(f"Build failed: {result.stderr.decode()}")
        return False
    
    # Copy build to static
    build_dir = dashboard_dir / "dist"
    if build_dir.exists():
        shutil.copytree(build_dir, static_dir)
        logger.info(f"✅ Dashboard built and copied to {static_dir}")
        return True
    else:
        logger.error(f"Build directory not found: {build_dir}")
        return False

def main():
    logger.info("🏗️ Building React Dashboard...")
    success = build_dashboard()
    if success:
        logger.info("✅ Dashboard build complete!")
    else:
        logger.error("❌ Dashboard build failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()