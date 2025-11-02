#!/usr/bin/env python3
"""
Fetch JIRA issues for test case generation.
"""
import sys
import json
import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path, override=True)

# Add backend src to path
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from src.integrations.jira import get_active_sprint, get_sprint_issues, get_issue_by_key, get_jira_headers, extract_text_from_adf, JIRA_BASE
import requests

# Get JIRA Board ID from environment
JIRA_BOARD_ID = os.getenv("JIRA_BOARD_ID", "3968")

def fetch_sprint_issues(project_key: str = None):
    """Fetch all issues from the active sprint."""
    # Try the active sprint approach first
    sprint_result = get_active_sprint(project_key)
    
    if sprint_result.get('success'):
        sprint = sprint_result['sprint']
        sprint_id = sprint.get('id')
        
        if sprint_id:
            # Get issues in the sprint
            issues_result = get_sprint_issues(sprint_id)
            
            if issues_result.get('success'):
                return {
                    'success': True,
                    'sprint': {
                        'id': sprint['id'],
                        'name': sprint.get('name', 'Unknown'),
                        'state': sprint.get('state', 'active')
                    },
                    'issues': issues_result['issues']
                }
    
    # Fallback: Just get recent issues from the project
    return fetch_recent_project_issues(project_key)

def fetch_issues_by_jql(project_key: str, headers: dict):
    """Fallback method to fetch issues using JQL search."""
    print(f"Fetching issues using JQL for project {project_key}...", file=sys.stderr)
    
    # Use JQL to search for all issues in the project
    search_url = f"{JIRA_BASE}/rest/api/3/search"
    
    params = {
        'jql': f'project={project_key} ORDER BY created DESC',
        'maxResults': 100,
        'fields': 'summary,description,issuetype,priority,status'
    }
    
    response = requests.get(search_url, params=params, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    return data.get('issues', [])

def fetch_recent_project_issues(project_key: str):
    """Fetch all issues from the project board."""
    print(f"Fetching all issues from project board {project_key}...", file=sys.stderr)
    
    headers = get_jira_headers()
    
    # Use the board ID from environment/configuration
    board_id = JIRA_BOARD_ID
    print(f"Using board ID: {board_id}", file=sys.stderr)
    
    try:
        # Get all issues from the board
        board_issues_url = f"{JIRA_BASE}/rest/agile/1.0/board/{board_id}/issue"
        board_params = {
            'maxResults': 100,
            'fields': 'summary,description,issuetype,priority,status'
        }
        
        response = requests.get(board_issues_url, headers=headers, params=board_params)
        response.raise_for_status()
        data = response.json()
        issues = data.get('issues', [])
        
    except Exception as e:
        print(f"Error fetching from board: {str(e)}, falling back to JQL search", file=sys.stderr)
        issues = fetch_issues_by_jql(project_key, headers)
    
    if not issues:
        print(f"No issues found on board, trying JQL search", file=sys.stderr)
        issues = fetch_issues_by_jql(project_key, headers)
    
    formatted_issues = []
    for issue in issues:
        key = issue.get('key', 'N/A')
        fields = issue.get('fields', {})
        
        # Handle different description formats
        description = fields.get('description', '')
        if isinstance(description, dict):
            description = extract_text_from_adf(description)
        elif description is None:
            description = ''
        
        formatted_issues.append({
            'key': key,
            'summary': fields.get('summary', 'N/A'),
            'type': fields.get('issuetype', {}).get('name', 'N/A'),
            'priority': fields.get('priority', {}).get('name', 'N/A'),
            'status': fields.get('status', {}).get('name', 'N/A'),
            'description': description
        })
    
    print(f"Found {len(formatted_issues)} issues in project {project_key}", file=sys.stderr)
    return {
        'success': True,
        'issues': formatted_issues
    }

def fetch_issue_by_key(issue_key: str):
    """Fetch a specific issue by its key."""
    result = get_issue_by_key(issue_key)
    return result

def main():
    parser = argparse.ArgumentParser(description='Fetch JIRA issues')
    parser.add_argument('--mode', choices=['sprint', 'issue'], required=True,
                        help='Fetch mode: sprint (all issues in active sprint) or issue (specific issue)')
    parser.add_argument('--project-key', type=str,
                        help='JIRA project key (for sprint mode)')
    parser.add_argument('--issue-key', type=str,
                        help='JIRA issue key (for issue mode)')
    
    args = parser.parse_args()
    
    try:
        if args.mode == 'sprint':
            result = fetch_sprint_issues(args.project_key)
        elif args.mode == 'issue':
            if not args.issue_key:
                result = {'success': False, 'error': '--issue-key is required for issue mode'}
            else:
                result = fetch_issue_by_key(args.issue_key)
        else:
            result = {'success': False, 'error': 'Invalid mode'}
        
        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get('success') else 1)
    
    except Exception as e:
        error_result = {'success': False, 'error': str(e)}
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
