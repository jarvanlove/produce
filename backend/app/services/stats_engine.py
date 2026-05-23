import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional


def calculate_class_avg(scores: pd.Series) -> float:
    return round(scores.mean(), 1)


def calculate_std_dev(scores: pd.Series) -> float:
    return round(scores.std(), 1)


def calculate_pass_rate(scores: pd.Series, full_score: Optional[float] = None) -> float:
    pass_line = full_score * 0.6 if full_score else 60.0
    return round((scores >= pass_line).sum() / len(scores), 3)


def calculate_excellent_rate(scores: pd.Series, full_score: Optional[float] = None) -> float:
    excellent_line = full_score * 0.9 if full_score else 90.0
    return round((scores >= excellent_line).sum() / len(scores), 3)


def score_distribution(scores: pd.Series, full_score: Optional[float] = None) -> List[Dict[str, Any]]:
    if full_score and full_score > 0:
        max_score = scores.max()
        top = max(max_score * 1.01, full_score * 2)
        bins = [
            0,
            full_score * 0.6,
            full_score * 0.7,
            full_score * 0.8,
            full_score * 0.9,
            full_score,
            top,
        ]
        labels = ["<60%", "60-70%", "70-80%", "80-90%", "90-100%", "100%+"]
    else:
        bins = [0, 60, 70, 80, 90, 100, 200]
        labels = ["<60", "60-70", "70-80", "80-90", "90-100", "100+"]

    dist = pd.cut(scores, bins=bins, labels=labels, include_lowest=True, right=False).value_counts().sort_index()
    return [{"range": str(idx), "count": int(val)} for idx, val in dist.items() if not pd.isna(idx)]


def detect_continuous_decline(history: List[float]) -> bool:
    """连续3次下滑"""
    if len(history) < 3:
        return False
    for i in range(len(history) - 2):
        if history[i] > history[i+1] > history[i+2]:
            return True
    return False


def detect_sharp_drop(history: List[float], threshold: float = 10.0) -> bool:
    """单次退步超过 threshold 分"""
    if len(history) < 2:
        return False
    return history[-2] - history[-1] >= threshold


def detect_severe_imbalance(subject_scores: Dict[str, float]) -> bool:
    """偏科：最高分与最低分相差超过 20 分"""
    if len(subject_scores) < 2:
        return False
    scores = list(subject_scores.values())
    return max(scores) - min(scores) >= 20
