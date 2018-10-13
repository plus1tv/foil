# Foilfolio Github Daemon

A **Continuous Delivery** service that automatically updates the server from github push events.

## How It Works

Github sends a push event to an endpoint on your server, which is mapped to the daemon on nginx.

```nginx
location /api/v1/github {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

The daemon in turn:

1. Does an *HMAC SHA1* check to verify that this was indeed github.

2. `git pull` the repo.

3. For each lerna package in your repository that's among the files updated, it will install updates and rebuild it.

4. If there's a known server running (such as `foilfolio-express-mongo`), it will kill that process and restart it if files have changed.