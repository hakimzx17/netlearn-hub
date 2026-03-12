$token = Get-Content "token.txt" -Raw
$env:GH_TOKEN = $token.Trim()
git add .
git commit -m "Initial commit - NetLearnHub"
& "C:\Program Files\GitHub CLI\gh.exe" repo create NetLearnHub --public --source=. --push --description "Network Learning Platform"
