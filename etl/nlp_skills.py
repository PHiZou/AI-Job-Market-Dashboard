"""
Extract skills from job descriptions using regex, keyword matching, and optional LLM.

Supports both rule-based extraction and LLM-based extraction for novel skills.
"""

import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Set, Any, Optional

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# LLM Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
USE_LLM = bool(OPENAI_API_KEY)


def extract_skills() -> Dict[str, Any]:
    """
    Extract skills from job descriptions.
    
    Returns:
        Dictionary with success status, count, and error message if any.
    """
    try:
        # Load cleaned jobs
        input_file = Path('data/curated/jobs_clean.parquet')
        if not input_file.exists():
            error_msg = f"Cleaned jobs file not found: {input_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'count': 0}
        
        df = pd.read_parquet(input_file)
        logger.info(f"Loaded {len(df)} jobs for skill extraction")
        
        # Load skills master list
        skills_df = pd.read_csv('config/skills_master.csv')
        logger.info(f"Loaded {len(skills_df)} skills from master list")
        
        # Build regex patterns for each skill
        skill_patterns = build_skill_patterns(skills_df)
        
        # Extract skills for each job
        logger.info("Extracting skills using regex and keyword matching...")
        df['skills'] = df.apply(
            lambda row: extract_skills_from_text(
                row.get('job_description', '') or '',
                row.get('job_title_clean', '') or '',
                skill_patterns
            ),
            axis=1
        )
        
        # Optional: Use LLM for additional skill extraction
        if USE_LLM:
            logger.info("Using LLM for additional skill extraction...")
            df['skills_llm'] = df.apply(
                lambda row: extract_skills_with_llm(
                    row.get('job_description', '') or '',
                    row.get('job_title_clean', '') or ''
                ),
                axis=1
            )
            # Merge LLM skills with regex skills
            df['skills'] = df.apply(
                lambda row: list(set(row['skills'] + row.get('skills_llm', []))),
                axis=1
            )
        
        # Count skills per job
        df['skill_count'] = df['skills'].apply(len)
        
        # Save updated data
        output_file = Path('data/curated/jobs_clean.parquet')
        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} jobs with extracted skills to {output_file}")
        
        # Statistics
        avg_skills = df['skill_count'].mean()
        total_unique_skills = len(set([skill for skills_list in df['skills'] for skill in skills_list]))
        logger.info(f"Average skills per job: {avg_skills:.2f}")
        logger.info(f"Total unique skills found: {total_unique_skills}")
        
        return {
            'success': True,
            'count': len(df),
            'avg_skills_per_job': float(avg_skills),
            'total_unique_skills': total_unique_skills
        }
        
    except Exception as e:
        error_msg = f"Error extracting skills: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'count': 0}


def build_skill_patterns(skills_df: pd.DataFrame) -> Dict[str, re.Pattern]:
    """
    Build regex patterns for each skill from the master list.
    
    Args:
        skills_df: DataFrame with skill_name and aliases columns
    
    Returns:
        Dictionary mapping skill names to compiled regex patterns
    """
    patterns = {}
    
    for _, row in skills_df.iterrows():
        skill_name = str(row['skill_name']).lower()
        aliases = str(row.get('aliases', '')).lower()
        
        # Build pattern: skill name + aliases
        pattern_parts = [re.escape(skill_name)]
        
        if aliases and aliases != 'nan':
            alias_list = [a.strip() for a in aliases.split('|')]
            pattern_parts.extend([re.escape(a) for a in alias_list])
        
        # Create pattern with word boundaries
        pattern_str = r'\b(?:' + '|'.join(pattern_parts) + r')\b'
        
        try:
            patterns[skill_name] = re.compile(pattern_str, re.IGNORECASE)
        except re.error as e:
            logger.warning(f"Invalid regex pattern for {skill_name}: {e}")
    
    return patterns


def extract_skills_from_text(
    description: str,
    title: str,
    skill_patterns: Dict[str, re.Pattern]
) -> List[str]:
    """
    Extract skills from text using regex patterns.
    
    Args:
        description: Job description text
        title: Job title
        skill_patterns: Dictionary of compiled regex patterns
    
    Returns:
        List of extracted skill names
    """
    if not description and not title:
        return []
    
    # Combine title and description
    text = f"{title} {description}".lower()
    
    found_skills = set()
    
    # Match each skill pattern
    for skill_name, pattern in skill_patterns.items():
        if pattern.search(text):
            found_skills.add(skill_name.title())
    
    return sorted(list(found_skills))


def extract_skills_with_llm(description: str, title: str) -> List[str]:
    """
    Extract skills using OpenAI LLM.
    
    Args:
        description: Job description text
        title: Job title
    
    Returns:
        List of extracted skill names
    """
    if not OPENAI_API_KEY:
        return []
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Truncate description if too long
        max_chars = 3000
        desc_truncated = description[:max_chars] if len(description) > max_chars else description
        
        prompt = f"""Extract technical skills and technologies mentioned in this job posting.
Return only a comma-separated list of skill names, nothing else.

Job Title: {title}
Job Description: {desc_truncated}

Skills:"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts technical skills from job postings. Return only a comma-separated list of skill names."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3
        )
        
        skills_text = response.choices[0].message.content.strip()
        skills = [s.strip() for s in skills_text.split(',') if s.strip()]
        
        return skills
        
    except Exception as e:
        logger.debug(f"LLM skill extraction failed: {str(e)}")
        return []


if __name__ == '__main__':
    # Test extraction
    result = extract_skills()
    print(f"Extraction result: {result}")

