from __future__ import annotations
import os
from typing import Any, Dict, List
from src.core.utils import http_post_json
import requests
from dotenv import load_dotenv
from pathlib import Path
import base64

# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path, override=True)

# Remove trailing slash from JIRA_BASE to avoid double slashes in URLs
JIRA_BASE = os.getenv("JIRA_BASE", "http://localhost:4001").rstrip('/')
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY", "QA")
JIRA_BEARER = os.getenv("JIRA_BEARER") or "demo-token"

def get_jira_headers():
    """Get appropriate authentication headers for JIRA API."""
    # For Atlassian Cloud, use Basic Auth (email:api_token)
    # For Server/Data Center, use Bearer token
    if JIRA_EMAIL:
        # Basic Auth for Cloud
        auth_string = f"{JIRA_EMAIL}:{JIRA_BEARER}"
        auth_bytes = auth_string.encode('ascii')
        base64_auth = base64.b64encode(auth_bytes).decode('ascii')
        return {
            "Authorization": f"Basic {base64_auth}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    else:
        # Bearer token for Server/Data Center
        return {
            "Authorization": f"Bearer {JIRA_BEARER}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

def create_issue(summary: str, description: str, issuetype: str = "Bug") -> Dict[str, Any]:
    url = f"{JIRA_BASE}/rest/api/3/issue"
    payload = {
        "fields": {
            "project": {"key": JIRA_PROJECT_KEY},
            "summary": summary,
            "description": description,
            "issuetype": {"name": issuetype},
        }
    }
    headers = get_jira_headers()
    return http_post_json(url, payload, headers=headers)

def get_active_sprint(project_key: str = None) -> Dict[str, Any]:
    """Get the active sprint for a project."""
    if not project_key:
        project_key = JIRA_PROJECT_KEY
    
    try:
        # Method 1: Try to get board and then sprints
        boards_url = f"{JIRA_BASE}/rest/agile/1.0/board?projectKeyOrId={project_key}"
        headers = get_jira_headers()
        
        boards_response = requests.get(boards_url, headers=headers)
        boards_response.raise_for_status()
        boards = boards_response.json()
        
        if not boards.get('values'):
            return {"success": False, "error": "No boards found for project"}
        
        board_id = boards['values'][0]['id']
        
        # Get all sprints and filter for active ones manually
        sprints_url = f"{JIRA_BASE}/rest/agile/1.0/board/{board_id}/sprint"
        sprints_response = requests.get(sprints_url, headers=headers)
        
        # If sprint endpoint fails, try alternative approach
        if sprints_response.status_code != 200:
            # Alternative: Search for issues in the project and get sprint from them
            return get_active_sprint_from_issues(project_key)
        
        sprints_response.raise_for_status()
        sprints = sprints_response.json()
        
        # Filter for active sprints
        active_sprints = [s for s in sprints.get('values', []) if s.get('state') == 'active']
        
        if not active_sprints:
            return {"success": False, "error": "No active sprints found"}
        
        return {"success": True, "sprint": active_sprints[0]}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_active_sprint_from_issues(project_key: str) -> Dict[str, Any]:
    """Alternative method: Get active sprint by searching issues."""
    try:
        headers = get_jira_headers()
        
        # Search for issues in active sprint
        jql = f"project={project_key} AND sprint in openSprints()"
        search_url = f"{JIRA_BASE}/rest/api/3/search"
        params = {
            "jql": jql,
            "maxResults": 1,
            "fields": "sprint"
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('total', 0) == 0:
            return {"success": False, "error": "No issues found in active sprint"}
        
        # Extract sprint info from the first issue
        issue = data['issues'][0]
        sprint_field = issue.get('fields', {}).get('sprint')
        
        if sprint_field:
            return {"success": True, "sprint": sprint_field}
        
        return {"success": False, "error": "No active sprint information found"}
    
    except Exception as e:
        return {"success": False, "error": f"Alternative method failed: {str(e)}"}

def get_sprint_issues(sprint_id: int) -> Dict[str, Any]:
    """Get all issues in a sprint."""
    try:
        url = f"{JIRA_BASE}/rest/agile/1.0/sprint/{sprint_id}/issue"
        headers = get_jira_headers()
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant issue information
        issues = []
        for issue in data.get('issues', []):
            fields = issue.get('fields', {})
            issues.append({
                'key': issue.get('key'),
                'id': issue.get('id'),
                'summary': fields.get('summary'),
                'description': fields.get('description'),
                'status': fields.get('status', {}).get('name'),
                'type': fields.get('issuetype', {}).get('name'),
                'priority': fields.get('priority', {}).get('name') if fields.get('priority') else None,
            })
        
        return {"success": True, "issues": issues}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_issue_by_key(issue_key: str) -> Dict[str, Any]:
    """Get a specific issue by its key."""
    try:
        # Use API v3
        url = f"{JIRA_BASE}/rest/api/3/issue/{issue_key}"
        headers = get_jira_headers()
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        issue = response.json()
        
        fields = issue.get('fields', {})
        
        # Extract description (handle both old and new formats)
        description = ""
        desc_field = fields.get('description')
        if desc_field:
            if isinstance(desc_field, dict):
                # New Atlassian Document Format
                description = extract_text_from_adf(desc_field)
            else:
                description = str(desc_field)
        
        return {
            "success": True,
            "issue": {
                'key': issue.get('key'),
                'id': issue.get('id'),
                'summary': fields.get('summary', ''),
                'description': description,
                'status': fields.get('status', {}).get('name', 'Unknown'),
                'type': fields.get('issuetype', {}).get('name', 'Task'),
                'priority': fields.get('priority', {}).get('name') if fields.get('priority') else None,
            }
        }
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return {"success": False, "error": f"Issue {issue_key} not found"}
        return {"success": False, "error": str(e)}
    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_text_from_adf(adf_content: Dict) -> str:
    """Extract plain text from Atlassian Document Format."""
    if not isinstance(adf_content, dict):
        return str(adf_content)
    
    text_parts = []
    
    def extract_from_node(node):
        if isinstance(node, dict):
            node_type = node.get('type')
            
            # Handle text nodes
            if node_type == 'text':
                text_parts.append(node.get('text', ''))
            
            # Handle content arrays
            if 'content' in node:
                for child in node['content']:
                    extract_from_node(child)
            
            # Add newlines for paragraph breaks
            if node_type == 'paragraph':
                text_parts.append('\n')
    
    extract_from_node(adf_content)
    return ''.join(text_parts).strip()
