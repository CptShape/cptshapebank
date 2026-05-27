# Windows Update Setup

## 1. Make Sure This GitHub Repo Exists

```text
https://github.com/CptShape/cptshapebank
```

What it does:
- stores the source code
- stores the Windows release files

## 2. Keep The Repo Public

What it does:
- lets the installed Windows app check releases without a secret token inside the app

## 3. Create A GitHub Token

GitHub path:

```text
GitHub -> Settings -> Developer settings -> Personal access tokens
```

Use:
- a fine-grained token
- repository access: `CptShape/cptshapebank`
- permission: `Contents` -> `Read and write`

What it does:
- lets the release command upload files to GitHub Releases

## 4. Put The Token In .env

[.env](/C:/Users/yasla/Documents/CptShapeBank/.env)

Example:

```text
GH_TOKEN=your_github_token_here
```

What it does:
- gives the publish command permission to upload the release

## 5. Change The Version In package.json

[package.json](/C:/Users/yasla/Documents/CptShapeBank/package.json)

Example:

```json
"version": "1.0.2"
```

What it does:
- tells the app which build is newer

## 6. Build And Publish The Release

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
npm.cmd install
npm.cmd run lint
npm.cmd run desktop:release
```

What it does:
- builds the web files
- builds the Windows installer
- uploads the release to GitHub

## 7. Check The Release On GitHub

GitHub path:

```text
GitHub -> CptShape/cptshapebank -> Releases
```

You should see files like:

```text
CptShapeBank-Setup-1.0.2.exe
latest.yml
```

What it does:
- `CptShapeBank-Setup-1.0.2.exe` is the installer
- `latest.yml` is what the installed app reads to detect updates

## 8. Use The Update Button In The Windows App

Inside the installed Windows app:
- open `Settings`
- press `Look For An Update`

What it does:
- checks GitHub Releases
- compares installed version with latest release
- offers the update if a newer version exists

Important:
- keep the default install path
- do not switch the install folder between versions
