# http://192.168.1.231 Test Plan

## Application Overview

Comprehensive UI test plan for the CasaOS web interface accessible at http://192.168.1.231. Covers login, dashboard interactions, search/filter, widgets, navigation to embedded services such as Jellyfin (port 8097), and error handling. Each scenario begins with a clean browser state and includes necessary authentication steps.

## Test Scenarios

### 1. Authentication

**Seed:** `tests/seed.spec.ts`

#### 1.1. Successful login to CasaOS

**File:** `tests/auth-success.spec.ts`

**Steps:**
  1. Navigate to the CasaOS login page
    - expect: The URL is http://192.168.1.231/#/login
  2. Confirm both username and password input fields are visible
    - expect: Login form fields are displayed
  3. Enter valid credentials and submit
    - expect: Dashboard loads at http://192.168.1.231/#/

#### 1.2. Failed login attempt

**File:** `tests/auth-failure.spec.ts`

**Steps:**
  1. Open the login page
    - expect: Login form is present
  2. Type incorrect username or password and click Login
    - expect: An error message or notification appears
    - expect: URL stays on the login page

### 2. Dashboard Functionality

**Seed:** `tests/seed.spec.ts`

#### 2.1. Access Jellyfin from dashboard

**File:** `tests/dashboard-jellyfin.spec.ts`

**Steps:**
  1. Log in and wait for dashboard to appear
    - expect: Dashboard URL is shown
  2. Find the Jellyfin application tile
    - expect: Tile with Jellyfin text/icon exists
  3. Click or extract the link and navigate
    - expect: New page URL contains ":8097"
    - expect: Jellyfin login form visible

#### 2.2. Search/filter apps on dashboard

**File:** `tests/dashboard-search.spec.ts`

**Steps:**
  1. Log in then focus dashboard search box
    - expect: Search input is visible
  2. Type an existing app name (e.g., "Files")
    - expect: Only that icon remains
  3. Clear search field
    - expect: All app icons reappear
  4. Enter a nonsensical query
    - expect: No icons shown; 'no results' state

#### 2.3. Verify dashboard system widgets

**File:** `tests/dashboard-widgets.spec.ts`

**Steps:**
  1. Log in and observe dashboard widgets
    - expect: CPU, RAM, Storage, Network labels visible

#### 2.4. Open widget settings panel

**File:** `tests/dashboard-widget-settings.spec.ts`

**Steps:**
  1. Log in and click the widget settings icon
    - expect: Widget settings overlay or pane appears
