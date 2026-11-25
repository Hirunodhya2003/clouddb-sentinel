# Owner: Member 08
"""
Pydantic v2 response schemas for Member 08 Audit Reports endpoints:
  - GET /api/v1/audit-reports
  - GET /api/v1/audit-reports/stock
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AuditActorSummary(BaseModel):
    user_id: Optional[int] = None
    employee_code: str = "SYS"
    username: str = "system"
    full_name: str = "System"
    role_name: str = "SYSTEM"


class AuditReportItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    audit_id: str
    source_table: str
    entity_table: str
    entity_id: int
    reference_code: str
    action_type: str
    action_label: str
    outcome: str
    badge_tone: str = "blue"
    is_stock_audit: bool = True
    is_derived_from_operational_tables: bool = True
    actor: AuditActorSummary
    variant_id: Optional[int] = None
    sku: Optional[str] = None
    product_name: Optional[str] = None
    quantity_impact: str
    event_timestamp: datetime
    summary: str
    before_state: str
    after_state: str


class AuditChartBucket(BaseModel):
    key: str
    label: str
    count: int
    heightPercent: int


class AuditReportSummary(BaseModel):
    totalEvents: int
    stockLedgerEvents: int
    adjustmentAudits: int
    returnAudits: int
    reconciliationsAndReturns: int
    needsReviewCount: int
    triggerGuardBlocks: int = 0
    chartSeries: List[AuditChartBucket] = Field(default_factory=list)
    recentHighlights: List[AuditReportItemResponse] = Field(default_factory=list)


class AuditReportResponse(BaseModel):
    items: List[AuditReportItemResponse]
    total: int
    summary: AuditReportSummary
    endpoint: str
    audit_logs_table_available: bool = False
    schema_dependency_notice: str
