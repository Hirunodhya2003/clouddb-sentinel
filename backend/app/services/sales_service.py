
from datetime import datetime
from typing import List

from app.schemas.sale import (
    SaleCreate,
    SaleResponse,
    SaleItemResponse
)


class SalesService:

    def __init__(self):
        self.sales = []
        self.next_sale_id = 1

    def create_sale(self, sale_data: SaleCreate) -> SaleResponse:
        sale_items = []
        total_amount = 0.0

        for index, item in enumerate(sale_data.items, start=1):
            subtotal = item.quantity * item.unit_price
            total_amount += subtotal

            sale_items.append(
                SaleItemResponse(
                    id=index,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=round(subtotal, 2)
                )
            )

        sale = SaleResponse(
            id=self.next_sale_id,
            customer_id=sale_data.customer_id,
            total_amount=round(total_amount, 2),
            created_at=datetime.now(),
            items=sale_items
        )

        self.sales.append(sale)
        self.next_sale_id += 1

        return sale

    def get_all_sales(self) -> List[SaleResponse]:
        return self.sales

    def get_sale_by_id(self, sale_id: int):
        for sale in self.sales:
            if sale.id == sale_id:
                return sale

        return None


sales_service = SalesService()
