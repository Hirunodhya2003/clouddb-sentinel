
<!-- Owner: Member 03 -->

# Views and Advanced Queries

## 1. Introduction

This document explains the database views, stored functions, JOIN operations, subqueries, and nested queries implemented by Member 03 in the CloudDB Sentinel project.

These database features help retrieve product and product variant information efficiently and demonstrate Advanced Database Management System (ADBMS) concepts.

## 2. Database Views

A database view is a virtual table created using a SQL SELECT statement. It displays data retrieved from one or more database tables.

### 2.1 Product Summary View

**View Name:** `product_view`

**SQL File:** `database/adbms/views/product_view.sql`

This view displays product information together with category details and the number of variants belonging to each product.

Tables used:
- `products`
- `categories`
- `product_variants`

ADBMS concepts demonstrated:
- INNER JOIN
- LEFT JOIN
- COUNT() aggregate function
- GROUP BY

### 2.2 Variant Details View

**View Name:** `variant_details_view`

**SQL File:** `database/adbms/views/variant_details_view.sql`

This view displays complete product variant information, including product name, SKU, size, colour, cost price, and selling price.

It also calculates:

- Profit Amount = Selling Price - Cost Price
- Profit Margin Percentage = (Profit Amount / Selling Price) × 100

The view uses CASE and ROUND functions to handle calculations safely.

Tables used:
- `product_variants`
- `products`
- `sizes`
- `colours`

ADBMS concepts demonstrated:
- Multiple-table INNER JOIN
- Calculated columns
- CASE expression
- ROUND() function

## 3. Stored Function

**Function Name:** `fn_check_variant_availability`

**SQL File:** `database/adbms/functions/fn_check_variant_availability.sql`

This function checks whether a given product variant exists and is active.

**Input Parameter:**
- `p_variant_id` – Product variant ID.

**Return Value:**
- TRUE – The variant exists and is active.
- FALSE – The variant does not exist or is inactive.

Example:

```sql
SELECT fn_check_variant_availability(1);
```

This function demonstrates:
- User-defined SQL functions
- Conditional data checking
- EXISTS subquery
- Boolean return values

## 4. JOIN Operations

**SQL File:** `database/adbms/advanced_queries/joins.sql`

JOIN operations combine related records from multiple tables.

The following JOIN examples are implemented:

### 4.1 INNER JOIN

Retrieves products together with their category names.

### 4.2 LEFT JOIN

Retrieves all products, including products that do not have variants.

### 4.3 Multiple-table JOIN

Combines product variants, products, sizes, and colours to display complete variant details.

### 4.4 Category and Product JOIN

Displays all categories and their related products, including categories without products.

## 5. Subqueries

**SQL File:** `database/adbms/advanced_queries/subqueries.sql`

A subquery is a SQL query nested inside another SQL query.

The implemented examples include:

1. Scalar Subquery – Finds products belonging to the category with the highest category ID.
2. Multi-row Subquery – Finds products that have at least one variant using IN.
3. Aggregate Subquery – Finds variants with selling prices above the average selling price.
4. Correlated Subquery – Finds products with more variants than the average number of variants per product.

## 6. Nested Queries

**SQL File:** `database/adbms/advanced_queries/nested_queries.sql`

The following nested query techniques are demonstrated:

### 6.1 EXISTS

Finds products that have at least one active variant.

### 6.2 NOT EXISTS

Finds products that do not have any variants.

### 6.3 Derived Table

Uses a derived table to calculate the number of variants for each product.

### 6.4 HAVING with Subquery

Finds products whose variant count is greater than the average variant count.

## 7. Testing

**SQL Test File:** `database/testing/test_views.sql`

The test script validates:

1. The existence of `product_view`.
2. The existence of `variant_details_view`.
3. The existence of `fn_check_variant_availability`.
4. The function returns FALSE for an invalid variant ID.

The test script was executed successfully.

**Test Result:**

`All Member 03 view and function tests passed!`

## 8. Execution Instructions

Open the MySQL command-line client and select the project database.

```sql
USE clouddb_sentinel;
```

Execute the SQL files in the following order:

```sql
SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/views/product_view.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/views/variant_details_view.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/functions/fn_check_variant_availability.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/advanced_queries/joins.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/advanced_queries/subqueries.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/adbms/advanced_queries/nested_queries.sql;

SOURCE C:/Users/DELL/Desktop/clouddb-sentinel/database/testing/test_views.sql;
```

**Note:** SELECT statements may return empty result sets when the database does not contain product or variant records. This does not mean the SQL statements failed.
