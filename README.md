# tritium-v4

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/scknurr/tritium-v4)

## Local Development with Supabase

This project can be run locally with a local Supabase instance via Docker.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v7 or later)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for database migrations and linking to remote project)

### Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/scknurr/tritium-v4.git
   cd tritium-v4
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the local Supabase instance:
   ```
   npm run supabase:start
   ```
   
   This will start the Supabase services on the following ports:
   - PostgreSQL: 5432
   - REST API: 8000
   - Supabase API: 54321
   - Supabase Studio: 9999

4. Access Supabase Studio at http://localhost:9999 in your browser.

5. Link to remote Supabase project:
   ```
   supabase link --project-ref vearpapzcfmtbtbrnuzb
   ```

6. Run the development server:
   ```
   npm run dev:local
   ```

7. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173).

### Simplified Setup

You can also use the provided setup script which handles all steps automatically:
```
./setup-local-dev.sh
```

### Stopping the Services

To stop the Supabase services, run:
```
npm run supabase:stop
```

To stop and remove volumes (will delete all data):
```
docker-compose down -v
```

### Troubleshooting

- If you encounter permission issues with Docker, you may need to run Docker commands with `sudo`.
- If ports are already in use, you can modify the port mappings in the `docker-compose.yml` file.
- Check the container logs for any errors:
  ```
  docker-compose logs -f
  ```