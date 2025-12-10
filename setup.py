"""
Minimal setup.py for compatibility with tools that don't fully support pyproject.toml.

Note: This project uses pyproject.toml as the primary configuration.
Dependencies should be installed via: pip install -r requirements.txt
"""

from setuptools import setup

setup(
    name="ai-job-market-dashboard",
    version="1.0.0",
    description="AI-Driven Job Market Intelligence Dashboard ETL Pipeline",
    python_requires=">=3.11",
    # Empty install_requires - use requirements.txt instead
    install_requires=[],
    packages=[],
)

