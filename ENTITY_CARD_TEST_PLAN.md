# Entity Card Testing Plan

This document outlines the testing approach for entity cards and standardized components in the Tritium application.

## Functional Testing

### DetailCard Component

1. **Rendering**
   - [ ] Verify card renders correctly with all required props
   - [ ] Check entity-specific styling (colors, borders) for each entity type
   - [ ] Test with and without images

2. **Actions**
   - [ ] Verify all action buttons work correctly
   - [ ] Test single action and multiple actions behavior
   - [ ] Confirm button variants (primary, outline, etc.) apply correctly

3. **States**
   - [ ] Test loading state with skeleton loader
   - [ ] Test empty state with and without action
   - [ ] Verify error state handling

### EntityDetailItem Component

1. **Basic Rendering**
   - [ ] Verify correct display of name, type icon, and entity link
   - [ ] Test with and without optional properties (description, secondary/tertiary fields)

2. **Interactive Behavior**
   - [ ] Verify clicking on entity name navigates to correct detail page
   - [ ] Test action buttons functionality
   - [ ] Confirm hover states work as expected

3. **Field Display**
   - [ ] Test status indicators with different colors
   - [ ] Verify date formatting options
   - [ ] Test all icon variants in fields

### EntityGrid Component

1. **Data Display**
   - [ ] Verify grid layout responsiveness on different screen sizes
   - [ ] Test with varying data set sizes (empty, few items, many items)
   - [ ] Confirm consistent spacing and alignment

2. **Relationship Rendering**
   - [ ] Test user-customer relationship display
   - [ ] Test user-skill relationship display
   - [ ] Test customer-skill relationship display
   - [ ] Verify related entities are correctly linked

3. **Interactive Features**
   - [ ] Test view action navigation
   - [ ] Test edit action modal display
   - [ ] Verify loading/error states display correctly

### DataTable Component

1. **Column Configuration**
   - [ ] Verify all column types render correctly
   - [ ] Test sorting functionality
   - [ ] Confirm column widths and responsiveness

2. **Row Interaction**
   - [ ] Test row click navigation
   - [ ] Verify action buttons in cells
   - [ ] Confirm entity linking works in the first column

3. **States**
   - [ ] Test empty table state
   - [ ] Verify loading state with spinner
   - [ ] Confirm error display

## List Pages Testing

### Users Page

1. **Grid View**
   - [ ] Verify user cards show email and title
   - [ ] Test relationship display (customers and skills)
   - [ ] Confirm view and edit actions

2. **Table View**
   - [ ] Verify all columns show correct data
   - [ ] Test sorting by each column
   - [ ] Confirm action buttons work

3. **Filtering and Actions**
   - [ ] Test all filter options
   - [ ] Verify "Add User" opens the form
   - [ ] Test view/edit functionality

### Customers Page

1. **Grid View**
   - [ ] Verify customer cards show description and status
   - [ ] Test relationship display (team members and skills)
   - [ ] Confirm view and edit actions

2. **Table View**
   - [ ] Verify all columns show correct data including website formatting
   - [ ] Test status indicator styling
   - [ ] Confirm action buttons work

3. **Filtering and Actions**
   - [ ] Test industry and status filters
   - [ ] Verify "Add Customer" opens the form
   - [ ] Test view/edit functionality

### Skills Page

1. **Grid View**
   - [ ] Verify skill cards show category and description
   - [ ] Test relationship display (users and customers)
   - [ ] Confirm view and edit actions

2. **Table View**
   - [ ] Verify all columns show correct data
   - [ ] Test category tag styling
   - [ ] Confirm action buttons work

3. **Filtering and Actions**
   - [ ] Test category and name filters
   - [ ] Verify "Add Skill" opens the form
   - [ ] Test view/edit functionality

## Detail Pages Testing

### UserDetail Page

1. **Cards Structure**
   - [ ] Verify profile details card
   - [ ] Test skills card with relationships
   - [ ] Check customers card with relationships
   - [ ] Confirm timeline card

2. **Interactive Elements**
   - [ ] Test add skill functionality
   - [ ] Test add customer assignment
   - [ ] Verify edit profile opens form
   - [ ] Test all entity links to other detail pages

### CustomerDetail Page

1. **Cards Structure**
   - [ ] Verify customer details card
   - [ ] Test team members card with relationships
   - [ ] Check skills card with applications
   - [ ] Confirm timeline card

2. **Interactive Elements**
   - [ ] Test add team member functionality
   - [ ] Test add skill application
   - [ ] Verify edit customer opens form
   - [ ] Test all entity links to other detail pages

### SkillDetail Page

1. **Cards Structure**
   - [ ] Verify skill details card
   - [ ] Test users card with skill proficiencies
   - [ ] Confirm timeline card

2. **Interactive Elements**
   - [ ] Test all entity links to users and customers
   - [ ] Verify edit skill opens form
   - [ ] Test proficiency level indicators

## Performance Testing

1. **Large Data Sets**
   - [ ] Test EntityGrid with 100+ items
   - [ ] Test DataTable with 100+ items
   - [ ] Measure render times and responsiveness

2. **Relationship Loading**
   - [ ] Measure time to load relationships in EntityGrid
   - [ ] Test relationship filtering performance
   - [ ] Verify caching of relationship data

## Cross-Browser Testing

1. **Desktop Browsers**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

2. **Mobile Browsers**
   - [ ] iOS Safari
   - [ ] Android Chrome
   - [ ] Android Firefox

## Accessibility Testing

1. **Keyboard Navigation**
   - [ ] Test tab navigation through all interactive elements
   - [ ] Verify keyboard activation of buttons and links
   - [ ] Check focus indicators

2. **Screen Reader Compatibility**
   - [ ] Test with VoiceOver (Mac/iOS)
   - [ ] Test with NVDA or JAWS (Windows)
   - [ ] Verify proper labeling of all elements

3. **Color Contrast**
   - [ ] Verify text meets WCAG AA contrast requirements
   - [ ] Test entity color schemes for sufficient contrast
   - [ ] Check status indicators for visibility

## Responsive Design Testing

1. **Breakpoints**
   - [ ] Test all components at:
     - Mobile (< 640px)
     - Tablet (640px - 1024px)
     - Desktop (> 1024px)

2. **Layout Shifts**
   - [ ] Verify grid-to-list transitions
   - [ ] Test card layout adjustments
   - [ ] Check action button responsiveness

3. **Touch Compatibility**
   - [ ] Test all interactive elements on touch devices
   - [ ] Verify touch targets are large enough
   - [ ] Test gestures where applicable

## Error Handling

1. **API Failures**
   - [ ] Test empty state handling when API returns no data
   - [ ] Verify error display when API returns errors
   - [ ] Test retry mechanisms

2. **Type Errors**
   - [ ] Test with malformed data
   - [ ] Verify fallback text for missing properties
   - [ ] Check null/undefined handling

## Regression Testing

After implementing any fixes or updates, verify that:

1. **No Visual Regressions**
   - [ ] Compare before/after screenshots
   - [ ] Check for unexpected layout shifts
   - [ ] Verify consistent spacing and alignment

2. **No Functional Regressions**
   - [ ] All actions still work correctly
   - [ ] Navigation remains functional
   - [ ] Forms still submit properly

3. **No Performance Regressions**
   - [ ] Load times remain consistent or improve
   - [ ] No new memory leaks
   - [ ] Animation performance is smooth

## User Flow Testing

1. **Creation Flows**
   - [ ] Create new user → Add skills → Add to customer
   - [ ] Create new customer → Add team members → Add required skills
   - [ ] Create new skill → Apply to users → Apply to customers

2. **Management Flows**
   - [ ] Filter users → Edit user → View detail page
   - [ ] Filter customers → View detail → Add team member
   - [ ] Filter skills → View detail → Edit skill

## Documentation Verification

1. **Standards Compliance**
   - [ ] Verify all components follow the defined standards
   - [ ] Check for consistent naming and patterns
   - [ ] Confirm color scheme adherence

2. **Examples Accuracy**
   - [ ] Test all example code in documentation
   - [ ] Verify screenshots match current implementation
   - [ ] Check property names and types

## Issue Resolution Process

When issues are discovered:

1. **Categorize Issue**
   - Visual/styling issues
   - Functional/behavioral issues
   - Performance issues
   - Type errors

2. **Document with**
   - Screenshots/recordings
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser/device information

3. **Prioritize by**
   - User impact
   - Frequency of occurrence
   - Severity of impact
   - Visibility to users 