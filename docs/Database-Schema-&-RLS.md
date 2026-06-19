# Database Schema & Row-Level Security (RLS) 🗄️

This document outlines the database schema, security rules, and server-side RPC functions implemented in Supabase PostgreSQL for **Amazing Websites (The Vault)**.

---

## 📊 Database Schema Definitions

The schema consists of four principal tables designed with referential integrity constraints, auditing capability, and metadata tracking.

### 1. `users` Table
Stores synchronization data for authenticated profiles.
* **Security Level**: Read-only for standard users (their own profile), writeable via the profile sync mechanism.

| Column | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `REFERENCES auth.users(id)` | Matches the Supabase Auth UUID. |
| `first_name` | `text` | `NOT NULL` | Extracted from OAuth metadata. |
| `last_name` | `text` | `NULL` | Extracted from OAuth metadata. |
| `email` | `text` | `UNIQUE`, `NOT NULL` | Normalized lowercase email. |
| `last_login` | `timestamptz` | `DEFAULT now()` | Updated on every profile sync/refresh. |
| `contributions` | `integer` | `DEFAULT 0`, `CHECK (contributions >= 0)` | Total number of approved submissions. |
| `is_admin` | `boolean` | `DEFAULT false` | Determines admin console visibility. |

---

### 2. `visits` Table
Enforces geolocation tracking, logging connection IPs and coordinate states.
* **Security Level**: System-writeable and self-readable.

| Column | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique log identifier. |
| `user_id` | `uuid` | `REFERENCES auth.users(id)` | Profile that generated the visit. |
| `visitor_email` | `text` | `NOT NULL` | Stored email address. |
| `first_name` | `text` | `NOT NULL` | First name cache. |
| `last_name` | `text` | `NULL` | Last name cache. |
| `ip_address` | `text` | `NULL` | Resolved IP address. |
| `location` | `text` | `NULL` | City/Region/Country string. |
| `latitude` | `numeric` | `NULL` | Coordinate latitude (browser or IP). |
| `longitude` | `numeric` | `NULL` | Coordinate longitude (browser or IP). |
| `status` | `text` | `CHECK (status IN ('ip_only', 'granted', 'denied'))` | Geolocation status enum. |
| `created_at` | `timestamptz` | `DEFAULT now()` | Timestamp of visit event. |

---

### 3. `requests` Table
Acts as a suggestion queue, holding submissions for admin review.
* **Security Level**: Insertable by authenticated users; readable/updatable by administrators.

| Column | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Request transaction ID. |
| `user_id` | `uuid` | `REFERENCES auth.users(id)` | ID of the submitting user. |
| `user_name` | `text` | `NOT NULL` | Submitter display name. |
| `title` | `text` | `NOT NULL` | Resource name. |
| `url` | `text` | `NOT NULL` | External resource URL. |
| `category` | `text` | `NOT NULL` | Design/Coding category name. |
| `description` | `text` | `NULL` | Explanation details. |
| `preview_image` | `text` | `NULL` | URL of preview asset (.webp or .webm). |
| `status` | `text` | `DEFAULT 'pending'`, `CHECK (status IN ('pending', 'approved', 'rejected'))` | Approval status state. |
| `created_at` | `timestamptz` | `DEFAULT now()` | Submission date. |

---

### 4. `resources` Table
The production resource directory, holding the approved catalog.
* **Security Level**: Read-only to users with valid location grants; writeable only by RPC functions.

| Column | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Resource identifier. |
| `title` | `text` | `NOT NULL` | Catalog label. |
| `url` | `text` | `NOT NULL` | External link. |
| `category` | `text` | `NOT NULL` | Visual category mapping. |
| `description` | `text` | `NULL` | Details. |
| `preview_image` | `text` | `NULL` | Thumb media. |
| `created_at` | `timestamptz` | `DEFAULT now()` | Date of catalog entry. |

---

## 🔒 Row-Level Security (RLS) Architecture

Row-Level Security isolates access control from the client. RLS is enabled on all tables in the database.

### 1. The Geolocation Security Validation Function
The core security feature is the time-decay location verification function. Standard reads from the `resources` table are blocked unless a user has allowed browser geolocation tracking.

```sql
CREATE OR REPLACE FUNCTION public.has_recent_granted_location()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify if a 'granted' location record exists for the current user in the last 5 minutes
  RETURN EXISTS (
    SELECT 1 
    FROM visits
    WHERE user_id = auth.uid()
      AND status = 'granted'
      AND created_at >= (now() - interval '5 minutes')
  );
END;
$$;
```

> [!IMPORTANT]
> **Why `SECURITY DEFINER`?**
> PostgreSQL functions execute with the privileges of the calling user by default. Because the `visits` table is locked down to prevent direct user reads, standard users cannot select from it. Marking the function as `SECURITY DEFINER` causes the check to run with the privileges of the database owner, letting it query `visits` to confirm eligibility while keeping the log table private.

### 2. Table Security Policies

#### `resources`
* **SELECT**: Authorized only if `has_recent_granted_location()` returns `true`.
  ```sql
  CREATE POLICY "Read resources if location verified" 
  ON resources 
  FOR SELECT 
  TO authenticated 
  USING (has_recent_granted_location() = true);
  ```
* **INSERT/UPDATE/DELETE**: Denied for all users. Changes must go through the admin pipeline.

#### `visits`
* **INSERT**: Authenticated users can insert their own visits.
  ```sql
  CREATE POLICY "Insert own visits" 
  ON visits 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);
  ```
* **SELECT/UPDATE/DELETE**: Denied for standard users to prevent coordinate or IP tampering.

#### `requests`
* **INSERT**: Authenticated users can submit requests.
  ```sql
  CREATE POLICY "Insert suggestions" 
  ON requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);
  ```
* **SELECT**: Users can view their own submissions; administrators can view all submissions.
  ```sql
  CREATE POLICY "Read suggestions" 
  ON requests 
  FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR (SELECT is_admin FROM users WHERE id = auth.uid()) = true
  );
  ```

---

## ⚙️ Remote Procedure Calls (RPC)

Admin decisions are processed on the server via PostgreSQL functions to prevent tampering.

### 1. `approve_request`
Performs three operations in a database transaction: updates the request status, inserts the record into the resources catalog, and updates user metrics.

```sql
CREATE OR REPLACE FUNCTION public.approve_request(request_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_req record;
  v_is_admin boolean;
BEGIN
  -- 1. Check if the executing user is an administrator
  SELECT is_admin INTO v_is_admin FROM users WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can approve submissions.';
  END IF;

  -- 2. Fetch the target request and verify it is pending
  SELECT * INTO v_req FROM requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or has already been reviewed.';
  END IF;

  -- 3. Set the request status to approved
  UPDATE requests 
  SET status = 'approved' 
  WHERE id = request_id;

  -- 4. Insert the record into the resources table
  INSERT INTO resources (title, url, category, description, preview_image)
  VALUES (v_req.title, v_req.url, v_req.category, v_req.description, v_req.preview_image);

  -- 5. Increment the contributor's counter
  UPDATE users 
  SET contributions = contributions + 1 
  WHERE id = v_req.user_id;
END;
$$;
```

### 2. `reject_request`
Rejects a request, making it read-only.

```sql
CREATE OR REPLACE FUNCTION public.reject_request(request_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- 1. Check admin status
  SELECT is_admin INTO v_is_admin FROM users WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can reject submissions.';
  END IF;

  -- 2. Update status to rejected
  UPDATE requests 
  SET status = 'rejected' 
  WHERE id = request_id 
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or has already been reviewed.';
  END IF;
END;
$$;
```
