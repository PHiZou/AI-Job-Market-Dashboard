"""
Cluster jobs into categories using sentence-transformers embeddings and K-means clustering.

Generates embeddings for job descriptions and clusters them into meaningful categories.
"""

import logging
import pickle
from pathlib import Path
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Model configuration
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
NUM_CLUSTERS = 12  # Adjust based on data size


def cluster_jobs() -> Dict[str, Any]:
    """
    Cluster jobs into categories using embeddings and K-means.
    
    Returns:
        Dictionary with success status, categories count, and error message if any.
    """
    try:
        # Load cleaned jobs with skills
        input_file = Path('data/curated/jobs_clean.parquet')
        if not input_file.exists():
            error_msg = f"Cleaned jobs file not found: {input_file}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'categories': 0}
        
        df = pd.read_parquet(input_file)
        logger.info(f"Loaded {len(df)} jobs for clustering")
        
        if len(df) == 0:
            error_msg = "No jobs to cluster"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg, 'categories': 0}
        
        # Prepare text for embedding
        logger.info("Preparing job text for embedding...")
        df['text_for_embedding'] = df.apply(
            lambda row: prepare_text_for_embedding(row),
            axis=1
        )
        
        # Generate embeddings
        logger.info(f"Generating embeddings using {EMBEDDING_MODEL}...")
        model = SentenceTransformer(EMBEDDING_MODEL)
        texts = df['text_for_embedding'].tolist()
        embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
        
        logger.info(f"Generated embeddings of shape {embeddings.shape}")
        
        # Determine optimal number of clusters
        n_clusters = min(NUM_CLUSTERS, len(df) // 10)  # At least 10 jobs per cluster
        n_clusters = max(3, n_clusters)  # Minimum 3 clusters
        
        # Perform K-means clustering
        logger.info(f"Clustering into {n_clusters} categories...")
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        df['cluster_id'] = cluster_labels
        df['category'] = df['cluster_id'].apply(lambda x: f"cluster_{x}")
        
        # Analyze clusters
        logger.info("Analyzing clusters...")
        cluster_stats = analyze_clusters(df, embeddings, kmeans.cluster_centers_)
        
        # Save cluster model for future use
        model_dir = Path('data/curated')
        model_dir.mkdir(parents=True, exist_ok=True)
        with open(model_dir / 'kmeans_model.pkl', 'wb') as f:
            pickle.dump(kmeans, f)
        logger.info("Saved K-means model")
        
        # Save updated data
        output_file = Path('data/curated/jobs_clean.parquet')
        df.to_parquet(output_file, index=False, engine='pyarrow')
        logger.info(f"Saved {len(df)} jobs with cluster assignments to {output_file}")
        
        # Log cluster statistics
        for cluster_id in range(n_clusters):
            cluster_jobs = df[df['cluster_id'] == cluster_id]
            logger.info(f"Cluster {cluster_id}: {len(cluster_jobs)} jobs")
        
        return {
            'success': True,
            'categories': n_clusters,
            'cluster_stats': cluster_stats
        }
        
    except Exception as e:
        error_msg = f"Error clustering jobs: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {'success': False, 'error': error_msg, 'categories': 0}


def prepare_text_for_embedding(row: pd.Series) -> str:
    """
    Prepare text from job row for embedding.
    
    Combines title, description, skills, and other relevant fields.
    
    Args:
        row: Job row from DataFrame
    
    Returns:
        Combined text string
    """
    parts = []
    
    # Title
    if pd.notna(row.get('job_title_clean')):
        parts.append(str(row['job_title_clean']))
    
    # Description (truncated)
    if pd.notna(row.get('job_description')):
        desc = str(row['job_description'])[:500]  # Limit description length
        parts.append(desc)
    
    # Skills
    skills = row.get('skills')
    if skills is not None:
        # Handle list/array/numpy array case - check this first to avoid pd.notna() on arrays
        if isinstance(skills, np.ndarray):
            if skills.size > 0:
                parts.append(' '.join(str(s) for s in skills))
        elif isinstance(skills, (list, tuple)):
            if len(skills) > 0:
                parts.append(' '.join(str(s) for s in skills))
        elif isinstance(skills, float) and pd.isna(skills):
            # Skip NaN values
            pass
        else:
            # Handle scalar values (strings, numbers, etc.)
            parts.append(str(skills))
    
    # Company
    if pd.notna(row.get('company_name_clean')):
        parts.append(str(row['company_name_clean']))
    
    return ' '.join(parts)


def analyze_clusters(
    df: pd.DataFrame,
    embeddings: np.ndarray,
    cluster_centers: np.ndarray
) -> Dict[int, Dict[str, Any]]:
    """
    Analyze cluster characteristics.
    
    Args:
        df: DataFrame with cluster assignments
        embeddings: Job embeddings
        cluster_centers: K-means cluster centers
    
    Returns:
        Dictionary with cluster statistics
    """
    stats = {}
    
    for cluster_id in df['cluster_id'].unique():
        cluster_mask = df['cluster_id'] == cluster_id
        cluster_jobs = df[cluster_mask]
        cluster_embeddings = embeddings[cluster_mask]
        
        # Calculate average distance from center
        center = cluster_centers[cluster_id]
        distances = np.linalg.norm(cluster_embeddings - center, axis=1)
        avg_distance = float(np.mean(distances))
        
        # Most common skills in cluster
        all_skills = []
        for idx, skills_val in cluster_jobs['skills'].items():
            if skills_val is not None and not (isinstance(skills_val, float) and pd.isna(skills_val)):
                if isinstance(skills_val, (list, tuple, np.ndarray)):
                    all_skills.extend([str(s) for s in skills_val if s])
                elif pd.notna(skills_val):
                    all_skills.append(str(skills_val))
        
        from collections import Counter
        top_skills = [skill for skill, _ in Counter(all_skills).most_common(5)]
        
        # Most common job titles
        top_titles = cluster_jobs['job_title_clean'].value_counts().head(3).index.tolist()
        
        stats[cluster_id] = {
            'size': len(cluster_jobs),
            'avg_distance_from_center': avg_distance,
            'top_skills': top_skills,
            'top_titles': top_titles
        }
    
    return stats


if __name__ == '__main__':
    # Test clustering
    result = cluster_jobs()
    print(f"Clustering result: {result}")

