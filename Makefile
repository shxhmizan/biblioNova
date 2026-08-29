.PHONY: dev backend frontend db-up db-down migrate test

db-up:
	docker compose up -d
	@echo "Waiting for Postgres..."
	@until docker compose exec -T postgres pg_isready -U biblioagent >/dev/null 2>&1; do sleep 1; done

db-down:
	docker compose down

migrate:
	cd backend && uv run alembic upgrade head

backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev: db-up migrate
	@trap 'kill 0' EXIT INT TERM; \
	$(MAKE) backend & \
	$(MAKE) frontend & \
	wait

test:
	cd backend && uv run pytest
