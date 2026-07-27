from pydantic import BaseModel
from typing import List, Dict
from datetime import date

class DailyStats(BaseModel):
    date: date
    total_pixels: int
    color_distribution: Dict[str, int]  # HEX -> count

class TopAuthor(BaseModel):
    user_id: str
    username: str
    count: int

class StatsResponse(BaseModel):
    daily: DailyStats
    top_authors: List[TopAuthor]