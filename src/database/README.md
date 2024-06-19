postgres database uses a default postgres image, the latest ones.
credentials are passed in a .env file that cannot be in github at 'prod'

the credentials needed are
POSTGRES_PASSWORD=1234
psql -p port -U username -d database
\c database
\dt to show tables
SELECT * FROM public.tablename;