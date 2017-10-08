# MyVault

MyVault is a very basic web interface to browse secrets from a remote [HashiCorp's Vault](https://www.vaultproject.io/)

There's no intention to add features to configure Vault backend. But will see...

## Features
* Browse all the secrets
* View them
* Edit secrets with a fully Markdown editor (using [Editor.md](https://github.com/pandao/editor.md))
* Save modifications
* Print secrets

There will be more features in future.

## Dependencies
To use MyVault you will need a fully functional [Vault](https://www.vaultproject.io/) backup with LDAP authentication (other authentications will be added in the future).

## How to use it
You will need to do checkout the project and get the submodule for the editor:

```
git clone https://github.com/yuki/my-vault.git
cd my-vault
git submodule init
python2.7 -m SimpleHTTPServer 8000
```

Then got to your browser to http://localhost:8000

This is just for developing or to check it out. You should put the code behind a real web server and a **SSL certificate**
