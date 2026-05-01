- Check Node installed, npm installed 
- ask the user to clean AI file like agents.md, claude.md etc etc.. ande delete them
- ask the user if is using azure-devops or githb 
- Copy /content  files and folders filtering if is using azure devops or github to dont duplicate files dont move .agent-template.md
- ask to the user to choose the ir team (agents but will be empty files) and initialize them based on .agent-template.md
- execute npx @fission-ai/openspec init
- execute npx @different-ai/opencode-browser install and show result to the user
- check if rtk gain command works if not ask the user to install and configure https://github.com/rtk-ai/rtk#pre-built-binaries
- if the user chose Azure devops then check the command az devops if not show stepps to follow.
az extension add --name azure-devops
az config set extension.dynamic_install_allow_preview=true
az login
az devops login --organization https://dev.azure.com/<your-org>