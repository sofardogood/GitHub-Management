# GitHub API Quick Guide

Base URLs:
- REST: https://api.github.com
- GraphQL: https://api.github.com/graphql

Auth header:
Authorization: Bearer $GITHUB_TOKEN

Common REST endpoints used:
- GET /user/repos?per_page=100&affiliation=owner,collaborator,organization_member
- GET /repos/{owner}/{repo}/issues?state=all&per_page=100
- GET /repos/{owner}/{repo}/pulls?state=all&per_page=100
- GET /repos/{owner}/{repo}/commits?per_page=30

GraphQL usage:
- Repo language breakdown and pagination over repositories.

Rate limits:
- 5,000 requests/hour for authenticated REST
- Use caching and pagination to reduce calls.

