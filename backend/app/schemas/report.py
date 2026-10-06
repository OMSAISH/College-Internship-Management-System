from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class OverviewStatsResponse(BaseModel):
    total_students: int
    total_companies: int
    active_internships: int
    total_applications: int
    total_interviews: int
    total_placements: int
    placement_rate: float
    average_stipend: float

class StatusCount(BaseModel):
    status: str
    count: int

class DomainCount(BaseModel):
    domain: str
    count: int

class MonthlyTrend(BaseModel):
    month: str
    applications: int
    placements: int

class CompanyPerformance(BaseModel):
    id: int
    name: str
    industry: str
    internships_count: int
    applications_count: int
    average_rating: float

class StudentRanking(BaseModel):
    id: int
    name: str
    department: str
    gpa: float
    applications_count: int
    placement_status: str

class AnalyticsDashboardResponse(BaseModel):
    overview: OverviewStatsResponse
    status_distribution: List[StatusCount]
    domain_distribution: List[DomainCount]
    monthly_trends: List[MonthlyTrend]
    top_companies: List[CompanyPerformance]
    top_students: List[StudentRanking]
