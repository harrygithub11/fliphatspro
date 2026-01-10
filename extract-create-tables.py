import re

# Read SQL dump
with open('newyear (3).sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Tables we need to extract
missing_tables = [
    'admin_login_history',
    'admin_sessions',
    'emails',
    'email_send_jobs',
    'email_attachments',
    'email_bounces',
    'email_templates',
    'email_tracking_events',
    'notifications',
    'task_assignees',
    'task_attachments',
    'task_reads',
]

# Pattern to extract CREATE TABLE statements
# Matches from CREATE TABLE to the closing );
pattern = r'CREATE TABLE `([^`]+)` \([^;]+\) ENGINE=[^;]+;'

all_creates = re.findall(pattern, sql_content, re.DOTALL)

# Write CREATE TABLE statements for missing tables
with open('create-missing-tables.sql', 'w', encoding='utf-8') as f:
    f.write('-- CREATE TABLE statements for missing tables\n')
    f.write('-- Run this in your database to create the missing tables\n\n')
    
    for table in missing_tables:
        # Find the full CREATE TABLE statement for this table
        table_pattern = rf'CREATE TABLE `{table}` \([^)]+\) ENGINE=[^;]+;'
        match = re.search(table_pattern, sql_content, re.DOTALL)
        
        if match:
            f.write(f'-- Table: {table}\n')
            f.write(match.group(0))
            f.write('\n\n')
        else:
            # Try alternative pattern for tables with nested parentheses
            alt_pattern = rf'(CREATE TABLE `{table}` \([\s\S]*?\) ENGINE=[^;]+;)'
            alt_match = re.search(alt_pattern, sql_content)
            if alt_match:
                f.write(f'-- Table: {table}\n')
                f.write(alt_match.group(1))
                f.write('\n\n')
            else:
                f.write(f'-- Table: {table} (NOT FOUND in SQL dump)\n\n')

print('Done! Created: create-missing-tables.sql')
