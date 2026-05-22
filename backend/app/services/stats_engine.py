import pandas as pd
import numpy as np
from typing import List, Dict, Any


def calculate_class_avg(scores: pd.Series) -> float:
    return round(scores.mean(), 1)


def calculate_std_dev(scores: pd.Series) -> float:
    return round(scores.std(), 1)


def calculate_pass_rate(scores: pd.Series, pass_line: float = 60.0) -> float:
    return round((scores >= pass_line).sum() / len(scores), 3)


def calculate_excellent_rate(scores: pd.Series, excellent_line: float = 90.0) -> float:
    return round((scores >= excellent_line).sum() / len(scores), 3)


def score_distribution(scores: pd.Series) -> List[Dict[str, Any]]:
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
