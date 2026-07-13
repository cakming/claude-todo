# Deployment — todo.dvlpr.sh (GCP VM + Cloud Build)

This directory holds everything needed to run the app on the existing GCP VM:

| File | Purpose |
|------|---------|
| `deploy.sh` | Idempotent deploy: pull `main`, install, build frontend, reload backend (PM2). Runs **on the VM**. |
| `ecosystem.config.cjs` | PM2 process definition for the backend. |
| `nginx-todo.dvlpr.sh.conf` | Nginx site: serves the SPA and proxies `/api` + `/health` to the backend. |
| `../cloudbuild.yaml` | Cloud Build pipeline: on push to `main`, SSHes to the VM and runs `deploy.sh`. |
| `../backend/.env.production.example` | Template for `backend/.env` (real secrets live only on the VM). |
| `../frontend/.env.production` | `VITE_API_URL=/api` (same-origin API, no CORS). |

## Architecture

```
Browser ──HTTPS──> Nginx (:443, todo.dvlpr.sh)
                     ├── /            -> /var/www/vibe-todo/frontend/dist  (static SPA)
                     ├── /api/*       -> 127.0.0.1:3001  (Node/Express, PM2)
                     └── /health      -> 127.0.0.1:3001/health
                                         └── MongoDB (on the VM, :27017)
```

## One-time bootstrap (on the VM)

Prereqs already installed: Node, Nginx, PM2, Git, MongoDB.

```bash
# 1. Clone the repo to the app dir
sudo mkdir -p /var/www/vibe-todo
sudo chown "$USER" /var/www/vibe-todo
git clone https://github.com/cakming/claude-todo.git /var/www/vibe-todo
cd /var/www/vibe-todo

# 2. Create the backend production env (NOT committed — real secrets)
cp backend/.env.production.example backend/.env
#   then edit backend/.env:
#     - set JWT_SECRET to `openssl rand -hex 32`
#     - confirm MONGODB_URI / DB_NAME for the VM's MongoDB
nano backend/.env

# 3. First deploy (build + start under PM2)
APP_DIR=/var/www/vibe-todo bash deploy/deploy.sh

# 4. Make PM2 resurrect the app on VM reboot
pm2 startup    # run the command it prints
pm2 save

# 5. Nginx site + HTTPS
sudo cp deploy/nginx-todo.dvlpr.sh.conf /etc/nginx/sites-available/todo.dvlpr.sh
sudo ln -s /etc/nginx/sites-available/todo.dvlpr.sh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d todo.dvlpr.sh   # provisions TLS + HTTP->HTTPS redirect
```

Point DNS `todo.dvlpr.sh` (A record) at the VM's external IP before step 5 so
certbot can validate.

## Continuous deployment (Cloud Build)

After the one-time bootstrap, every push to `main` redeploys automatically.

1. Edit `../cloudbuild.yaml` substitutions `_VM_NAME` and `_ZONE`.
2. Create the trigger (see the header of `cloudbuild.yaml` for the exact command
   and the IAM roles the Cloud Build service account needs).
3. Ensure IAP TCP ingress to port 22 is allowed on the VM
   (firewall source range `35.235.240.0/20`).

Cloud Build then runs `deploy/deploy.sh` on the VM over an IAP SSH tunnel — no
public SSH port required.

## Manual redeploy

```bash
ssh <vm>
APP_DIR=/var/www/vibe-todo bash /var/www/vibe-todo/deploy/deploy.sh
```
