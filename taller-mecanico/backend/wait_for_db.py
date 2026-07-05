import time
import sys
import psycopg2
from urllib.parse import urlparse


def main():
    url = sys.argv[1]
    result = urlparse(url)
    user = result.username
    password = result.password
    host = result.hostname
    port = result.port or 5432
    dbname = result.path.lstrip("/")

    for i in range(30):
        try:
            conn = psycopg2.connect(
                dbname=dbname, user=user, password=password, host=host, port=port
            )
            conn.close()
            print("Database is ready!")
            return
        except psycopg2.OperationalError as e:
            print(f"Waiting for database... ({i+1}/30) - {e}")
            time.sleep(2)

    print("Database not ready after 60 seconds")
    sys.exit(1)


if __name__ == "__main__":
    main()
