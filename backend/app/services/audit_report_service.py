# Owner: Member 08
"""
Read-only Audit Report Service for Member 08:
  - GET /api/v1/audit-reports
  - GET /api/v1/audit-reports/stock

DEPENDENCY TRANSPARENCY (Member 10 - audit_logs):
  Member 10's `database/modules/audit/01_create_audit_logs_table.sql` and
  `backend/app/models/audit_log.py` are unimplemented stubs across all branches.
  Rather than inventing a fake `audit_logs` table schema, this service derives
  verifiable stock & operational audit trail records directly from the committed
  `stock_movements`, `stock_adjustments`, `stock_adjustment_items`,
  `sales_returns`, and `sales_return_items` tables, and clearly flags
  `is_derived_from_operational_tables = True` and `audit_logs_table_available = False`.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.audit_reports import (
    AuditActorSummary,
    AuditChartBucket,
    AuditReportItemResponse,
    AuditReportResponse,
    AuditReportSummary,
)

SCHEMA_DEPENDENCY_NOTICE = (
    "Member 10's audit_logs table is not yet implemented in the repository. "
    "These audit report entries are derived read-only from operational stock_movements, "
    "stock_adjustments, and sales_returns tables."
)


class AuditReportService:
    def __init__(self, repo: StockMovementRepository):
        self.repo = repo

    def _get_user_actor_map(self) -> Dict[int, AuditActorSummary]:
        tables = self.repo._existing_tables()
        if "users" not in tables:
            return {}

        has_roles = "roles" in tables
        try:
            if has_roles:
                rows = (
                    self.repo.db.execute(
                        text(
                            """
                            SELECT u.user_id, u.username, u.full_name, r.role_name
                            FROM users u
                            LEFT JOIN roles r ON u.role_id = r.role_id
                            """
                        )
                    )
                    .mappings()
                    .all()
                )
            else:
                rows = (
                    self.repo.db.execute(
                        text(
                            """
                            SELECT user_id, username, full_name, 'STAFF' AS role_name
                            FROM users
                            """
                        )
                    )
                    .mappings()
                    .all()
                )
        except Exception:
            return {}

        actors: Dict[int, AuditActorSummary] = {}
        for r in rows:
            uid = int(r["user_id"])
            actors[uid] = AuditActorSummary(
                user_id=uid,
                employee_code=f"EMP-{uid:02d}",
                username=r["username"] or f"user_{uid}",
                full_name=r["full_name"] or f"User #{uid}",
                role_name=(r["role_name"] or "STAFF").upper(),
            )
        return actors

    def _collect_operational_audit_items(self) -> List[AuditReportItemResponse]:
        actor_map = self._get_user_actor_map()
        default_actor = AuditActorSummary(
            user_id=None,
            employee_code="SYS",
            username="system_ledger",
            full_name="CloudDB Ledger Engine",
            role_name="SYSTEM",
        )

        items: List[AuditReportItemResponse] = []

        # 1. Stock movement ledger entries
        movements = self.repo.list_stock_movements()
        for mov in movements:
            mov_id = int(mov["movement_id"])
            m_type = mov["movement_type"]
            qty = int(mov["quantity"])
            is_outflow = m_type in (
                "SALE",
                "SUPPLIER_RETURN",
                "ADJUSTMENT_OUT",
                "DAMAGE",
            )
            signed_qty = f"-{qty} units" if is_outflow else f"+{qty} units"
            tone = (
                "red"
                if m_type == "DAMAGE"
                else ("amber" if is_outflow else "green")
            )

            items.append(
                AuditReportItemResponse(
                    audit_id=f"AUD-MOV-{mov_id}",
                    source_table="stock_movements",
                    entity_table="stock_movements",
                    entity_id=mov_id,
                    reference_code=f"MOV-{mov_id}",
                    action_type="STOCK_MOVEMENT_RECORDED",
                    action_label=f"Ledger {m_type.replace('_', ' ').title()}",
                    outcome="COMMITTED",
                    badge_tone=tone,
                    is_stock_audit=True,
                    is_derived_from_operational_tables=True,
                    actor=default_actor,
                    variant_id=int(mov["variant_id"]),
                    sku=mov.get("sku"),
                    product_name=mov.get("product_name"),
                    quantity_impact=signed_qty,
                    event_timestamp=mov["movement_date"],
                    summary=(
                        mov.get("notes")
                        or f"{m_type} recorded for {mov.get('sku', 'variant')} ({signed_qty})"
                    ),
                    before_state="Immutable ledger state prior to entry",
                    after_state=(
                        f"movement_type={m_type}, quantity={qty}, "
                        f"reference={mov.get('reference_type') or 'N/A'}:{mov.get('reference_id') or 'N/A'}"
                    ),
                )
            )

        # 2. Stock adjustment workflow audit entries
        adjustments = self.repo.list_stock_adjustments()
        for adj in adjustments:
            adj_id = int(adj["adjustment_id"])
            adj_status = adj["status"]
            net_diff = int(adj.get("net_quantity_difference", 0))
            sign = "+" if net_diff > 0 else ""
            first_item: Optional[Dict[str, Any]] = (
                adj["items"][0] if adj.get("items") else None
            )

            creator_id = adj.get("created_by") or adj.get("approved_by")
            actor = (
                actor_map.get(int(creator_id), default_actor)
                if creator_id is not None
                else default_actor
            )

            if adj_status == "COMPLETED":
                action_type = "ADJUSTMENT_COMPLETED"
                action_label = "Stock Adjustment Completed"
                outcome = "COMMITTED"
                tone = "green"
            elif adj_status == "APPROVED":
                action_type = "ADJUSTMENT_APPROVED"
                action_label = "Stock Adjustment Approved"
                outcome = "APPROVED"
                tone = "blue"
            elif adj_status == "REJECTED":
                action_type = "ADJUSTMENT_REJECTED"
                action_label = "Stock Adjustment Rejected"
                outcome = "REJECTED"
                tone = "red"
            else:
                action_type = "ADJUSTMENT_PENDING"
                action_label = "Stock Adjustment Pending Review"
                outcome = "NEEDS_REVIEW"
                tone = "amber"

            before_desc = (
                f"quantity_before={first_item['quantity_before']}"
                if first_item
                else "Adjustment initiated"
            )
            after_desc = (
                f"status={adj_status}, quantity_after={first_item['quantity_after']}, "
                f"net_difference={sign}{net_diff}"
                if first_item
                else f"status={adj_status}, net_difference={sign}{net_diff}"
            )

            items.append(
                AuditReportItemResponse(
                    audit_id=f"AUD-ADJ-{adj_id}",
                    source_table="stock_adjustments",
                    entity_table="stock_adjustments",
                    entity_id=adj_id,
                    reference_code=adj["adjustment_reference"],
                    action_type=action_type,
                    action_label=action_label,
                    outcome=outcome,
                    badge_tone=tone,
                    is_stock_audit=True,
                    is_derived_from_operational_tables=True,
                    actor=actor,
                    variant_id=first_item["variant_id"] if first_item else None,
                    sku=first_item.get("sku") if first_item else None,
                    product_name=first_item.get("product_name")
                    if first_item
                    else None,
                    quantity_impact=f"{sign}{net_diff} units",
                    event_timestamp=adj["adjustment_date"],
                    summary=f"{adj['adjustment_type']}: {adj['reason']}",
                    before_state=before_desc,
                    after_state=after_desc,
                )
            )

        # 3. Sales return workflow audit entries
        returns = self.repo.list_sales_returns()
        for ret in returns:
            ret_id = int(ret["return_id"])
            ret_status = ret["return_status"]
            total_qty = int(ret.get("total_quantity_returned", 0))
            first_item = ret["items"][0] if ret.get("items") else None

            if ret_status == "COMPLETED":
                action_type = "RETURN_COMPLETED"
                action_label = "Sales Return Completed"
                outcome = "COMMITTED"
                tone = "green"
            elif ret_status == "APPROVED":
                action_type = "RETURN_APPROVED"
                action_label = "Sales Return Approved"
                outcome = "APPROVED"
                tone = "blue"
            elif ret_status == "REJECTED":
                action_type = "RETURN_REJECTED"
                action_label = "Sales Return Rejected"
                outcome = "REJECTED"
                tone = "red"
            else:
                action_type = "RETURN_PENDING"
                action_label = "Sales Return Pending Inspection"
                outcome = "NEEDS_REVIEW"
                tone = "amber"

            items.append(
                AuditReportItemResponse(
                    audit_id=f"AUD-RET-{ret_id}",
                    source_table="sales_returns",
                    entity_table="sales_returns",
                    entity_id=ret_id,
                    reference_code=f"RET-{ret_id}",
                    action_type=action_type,
                    action_label=action_label,
                    outcome=outcome,
                    badge_tone=tone,
                    is_stock_audit=True,
                    is_derived_from_operational_tables=True,
                    actor=default_actor,
                    variant_id=first_item.get("variant_id")
                    if first_item
                    else None,
                    sku=first_item.get("sku") if first_item else None,
                    product_name=first_item.get("product_name")
                    if first_item
                    else None,
                    quantity_impact=f"+{total_qty} units (INR {ret['total_refund_amount']:.2f})",
                    event_timestamp=ret["return_date"],
                    summary=f"Sale #{ret['sale_id']} ({ret.get('invoice_number', '')}): {ret['return_reason']}",
                    before_state=f"sale_id={ret['sale_id']}",
                    after_state=(
                        f"return_status={ret_status}, quantity_returned={total_qty}, "
                        f"total_refund_amount={ret['total_refund_amount']:.2f}"
                    ),
                )
            )

        items.sort(key=lambda x: x.event_timestamp, reverse=True)
        return items

    def _build_summary(
        self, items: List[AuditReportItemResponse]
    ) -> AuditReportSummary:
        stock_ledger = sum(
            1 for i in items if i.source_table == "stock_movements"
        )
        adj_audits = sum(
            1 for i in items if i.source_table == "stock_adjustments"
        )
        ret_audits = sum(1 for i in items if i.source_table == "sales_returns")
        needs_review = sum(
            1
            for i in items
            if i.outcome in ("NEEDS_REVIEW", "REJECTED", "BLOCKED")
        )
        trigger_blocks = sum(1 for i in items if i.outcome == "BLOCKED")

        month_abbrs = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]

        if items:
            latest_ts = max(item.event_timestamp for item in items)
            anchor_year, anchor_month = latest_ts.year, latest_ts.month
        else:
            now = datetime.utcnow()
            anchor_year, anchor_month = now.year, now.month

        anchor_total_months = anchor_year * 12 + (anchor_month - 1)
        window_months: List[tuple[int, int]] = []
        for offset in range(9, -1, -1):
            total_m = anchor_total_months - offset
            year = total_m // 12
            month = (total_m % 12) + 1
            window_months.append((year, month))

        counts_by_month: Dict[tuple[int, int], int] = {
            ym: 0 for ym in window_months
        }
        for item in items:
            ym = (item.event_timestamp.year, item.event_timestamp.month)
            if ym in counts_by_month:
                counts_by_month[ym] += 1

        max_count = (
            max(counts_by_month.values())
            if any(counts_by_month.values())
            else 1
        )
        chart_series = [
            AuditChartBucket(
                key=f"{year:04d}-{month:02d}",
                label=month_abbrs[month - 1],
                count=counts_by_month[(year, month)],
                heightPercent=max(
                    18, round((counts_by_month[(year, month)] / max_count) * 100)
                )
                if counts_by_month[(year, month)] > 0
                else 18,
            )
            for (year, month) in window_months
        ]

        return AuditReportSummary(
            totalEvents=len(items),
            stockLedgerEvents=stock_ledger,
            adjustmentAudits=adj_audits,
            returnAudits=ret_audits,
            reconciliationsAndReturns=adj_audits + ret_audits,
            needsReviewCount=needs_review,
            triggerGuardBlocks=trigger_blocks,
            chartSeries=chart_series,
            recentHighlights=items[:4],
        )

    def _filter_items(
        self,
        items: List[AuditReportItemResponse],
        search: Optional[str] = None,
        source_table: Optional[str] = None,
        action_type: Optional[str] = None,
        outcome: Optional[str] = None,
        actor_user_id: Optional[int] = None,
        variant_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        only_stock_audits: bool = False,
    ) -> List[AuditReportItemResponse]:
        q_lower = search.strip().lower() if search else None
        results: List[AuditReportItemResponse] = []

        for item in items:
            if only_stock_audits and not item.is_stock_audit:
                continue
            if (
                source_table
                and source_table != "ALL"
                and item.source_table != source_table
            ):
                continue
            if (
                action_type
                and action_type != "ALL"
                and item.action_type != action_type
            ):
                continue
            if outcome and outcome != "ALL" and item.outcome != outcome:
                continue
            if (
                actor_user_id is not None
                and item.actor.user_id != int(actor_user_id)
            ):
                continue
            if variant_id is not None and item.variant_id != int(variant_id):
                continue

            date_prefix = item.event_timestamp.strftime("%Y-%m-%d")
            if from_date and date_prefix < from_date:
                continue
            if to_date and date_prefix > to_date:
                continue

            if q_lower:
                haystack = " ".join(
                    [
                        item.audit_id,
                        item.source_table,
                        item.entity_table,
                        str(item.entity_id),
                        item.reference_code,
                        item.action_type,
                        item.action_label,
                        item.outcome,
                        item.actor.full_name,
                        item.actor.username,
                        item.sku or "",
                        item.product_name or "",
                        item.summary,
                        item.before_state,
                        item.after_state,
                    ]
                ).lower()
                if q_lower not in haystack:
                    continue

            results.append(item)

        return results

    def get_audit_reports(
        self,
        search: Optional[str] = None,
        source_table: Optional[str] = None,
        action_type: Optional[str] = None,
        outcome: Optional[str] = None,
        actor_user_id: Optional[int] = None,
        variant_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> AuditReportResponse:
        all_items = self._collect_operational_audit_items()
        filtered = self._filter_items(
            all_items,
            search=search,
            source_table=source_table,
            action_type=action_type,
            outcome=outcome,
            actor_user_id=actor_user_id,
            variant_id=variant_id,
            from_date=from_date,
            to_date=to_date,
            only_stock_audits=False,
        )
        has_audit_logs = "audit_logs" in self.repo._existing_tables()
        return AuditReportResponse(
            items=filtered,
            total=len(filtered),
            summary=self._build_summary(filtered),
            endpoint="/api/v1/audit-reports",
            audit_logs_table_available=has_audit_logs,
            schema_dependency_notice=SCHEMA_DEPENDENCY_NOTICE,
        )

    def get_stock_audit_reports(
        self,
        search: Optional[str] = None,
        source_table: Optional[str] = None,
        action_type: Optional[str] = None,
        outcome: Optional[str] = None,
        actor_user_id: Optional[int] = None,
        variant_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> AuditReportResponse:
        all_items = self._collect_operational_audit_items()
        filtered = self._filter_items(
            all_items,
            search=search,
            source_table=source_table,
            action_type=action_type,
            outcome=outcome,
            actor_user_id=actor_user_id,
            variant_id=variant_id,
            from_date=from_date,
            to_date=to_date,
            only_stock_audits=True,
        )
        has_audit_logs = "audit_logs" in self.repo._existing_tables()
        return AuditReportResponse(
            items=filtered,
            total=len(filtered),
            summary=self._build_summary(filtered),
            endpoint="/api/v1/audit-reports/stock",
            audit_logs_table_available=has_audit_logs,
            schema_dependency_notice=SCHEMA_DEPENDENCY_NOTICE,
        )
