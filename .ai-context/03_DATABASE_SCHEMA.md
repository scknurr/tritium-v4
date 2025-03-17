# 💾 Database Schema Reference

This file documents the core database tables, their relationships, and important fields.

## 🏢 Core Entities

### `customers`

Stores customer organization information.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | text | Customer name |
| description | text | Optional description |
| website | text | Optional website URL |
| industry_id | integer | Foreign key to industries |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `industries`

Categorizes customers by industry.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | text | Industry name |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `skills`

Stores skill definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | text | Skill name |
| description | text | Optional description |
| category_id | integer | Foreign key to skill categories |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `profiles`

Stores user profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (from auth.users) |
| full_name | text | User's full name |
| email | text | User's email |
| title | text | User's job title |
| bio | text | Optional biography |
| avatar_url | text | Optional avatar image URL |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

## 🔗 Relationship Tables

### `user_customers`

Links users to customers (team members).

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | uuid | Foreign key to profiles |
| customer_id | integer | Foreign key to customers |
| role_id | integer | Foreign key to customer_roles (optional) |
| role | text | Custom role text (optional) |
| start_date | date | When user started at customer |
| end_date | date | When user ended at customer (null if active) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `customer_roles`

Predefined roles for users at customers.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | text | Role name |
| description | text | Role description |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `skill_applications`

Records when a user applies a skill at a customer.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | uuid | Foreign key to profiles |
| skill_id | integer | Foreign key to skills |
| customer_id | integer | Foreign key to customers |
| proficiency | text | Proficiency level (NOVICE, INTERMEDIATE, ADVANCED, EXPERT) |
| start_date | date | When skill application started |
| end_date | date | When skill application ended (null if active) |
| notes | text | Optional notes |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### `user_skills`

Links users to skills (without customer context).

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| user_id | uuid | Foreign key to profiles |
| skill_id | integer | Foreign key to skills |
| proficiency | text | Proficiency level |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

## 📝 Audit and Timeline

### `audit_logs`

Stores system activity for the timeline.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| type | text | Event type (e.g., CREATED, UPDATED, SKILL_APPLIED) |
| description | text | Human-readable description |
| entity_type | text | Entity type (e.g., customers, skills) |
| entity_id | text | Entity ID |
| user_id | uuid | Foreign key to profiles (who performed action) |
| metadata | jsonb | Additional JSON data about the event |
| created_at | timestamp | When the event occurred |

## ⚠️ Critical Points

### Data Inconsistency Issue

- Skill applications are stored in both `skill_applications` and `audit_logs`
- When applying a skill:
  1. Entry is created in `skill_applications` table
  2. Audit log entry is created in `audit_logs` with:
     - `type`: "SKILL_APPLIED" 
     - `entity_type`: "skill_applications"
     - `metadata`: Contains user_id, skill_id, customer_id

### Checking for Inconsistencies

To check for inconsistencies, compare:

```sql
-- Direct skill applications for a customer
SELECT * FROM skill_applications 
WHERE customer_id = 1 AND end_date IS NULL;

-- Timeline skill applications for a customer
SELECT * FROM audit_logs 
WHERE (entity_type = 'skill_applications' OR 
      (metadata->>'customer_id')::integer = 1) 
      AND type = 'SKILL_APPLIED';
``` 