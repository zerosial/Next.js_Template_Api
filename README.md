# Express API Server

## 개요

이 프로젝트는 Express.js와 PostgreSQL을 사용하여 유저 관리와 인보이스 관리 기능을 제공하는 REST API 서버입니다. 모든 엔드포인트는 `/next` 경로로 시작하며, 유저 및 인보이스 데이터를 관리할 수 있는 다양한 API가 포함되어 있습니다.

## 사전 준비

- Node.js
- npm (Node 패키지 매니저)
- PostgreSQL

## 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone https://github.com/your-username/express-api-server.git
cd express-api-server

```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음과 같이 설정합니다:

```bash
POSTGRES_URL="postgres://<username>:<password>@<host>:<port>/<database>?sslmode=require"
// 예시는 다음과 같습니다
// POSTGRES_URL="postgres://user123:securepassword@db-hostname:5432/mydatabase?sslmode=require"

```

### 3. npm 패키지 설치

```bash
npm install

```

### 4. 서버 실행

```bash
node index.js

```

서버는 `http://localhost:6969`에서 실행됩니다.

## API 엔드포인트

### 1. `/next/users`

### 1.1 모든 유저 데이터 가져오기 (GET)

```
GET /next/users

```

유저 목록을 반환합니다.

### 1.2 유저 생성 (POST)

```
POST /next/users

```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword"
}
```

새로운 유저를 생성합니다.

### 1.3 유저 업데이트 (PUT)

```
PUT /next/users/:id

```

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "newsecurepassword"
}
```

해당 `id`의 유저 정보를 업데이트합니다.

### 1.4 유저 삭제 (DELETE)

```
DELETE /next/users/:id

```

해당 `id`의 유저를 삭제합니다.

### 2. `/next/revenue`

### 2.1 수익 데이터 가져오기 (GET)

```
GET /next/revenue

```

수익 데이터를 반환합니다.

### 3. `/next/latest-invoices`

### 3.1 최신 인보이스 가져오기 (GET)

```
GET /next/latest-invoices

```

최신 5개의 인보이스를 반환합니다.

### 4. `/next/invoice-card-data`

### 4.1 인보이스 및 고객 통계 가져오기 (GET)

```
GET /next/invoice-card-data

```

총 인보이스 개수, 총 고객 수, 지불된 인보이스 총액 및 대기 중인 인보이스 총액을 반환합니다.

### 5. `/next/customers`

### 5.1 고객 목록 가져오기 (GET)

```
GET /next/customers

```

고객 목록을 반환합니다.

### 6. `/next/filtered-invoices`

### 6.1 필터링된 인보이스 가져오기 (GET)

```
GET /next/filtered-invoices?query=example&page=1

```

특정 필터 조건을 만족하는 인보이스 목록을 페이지네이션으로 반환합니다.

### 7. `/invoices`

### 7.1 인보이스 생성 (POST)

```
POST /invoices

```

**Request Body:**

```json
{
  "customerId": "customer_id",
  "amount": 1000,
  "status": "pending"
}
```

새로운 인보이스를 생성합니다.

### 7.2 인보이스 업데이트 (PUT)

```
PUT /invoices/:id

```

**Request Body:**

```json
{
  "customerId": "customer_id",
  "amount": 1500,
  "status": "paid"
}
```

해당 `id`의 인보이스 정보를 업데이트합니다.

### 7.3 인보이스 삭제 (DELETE)

```
DELETE /invoices/:id

```

해당 `id`의 인보이스를 삭제합니다.

---

## 사용 예시

### 유저 데이터 가져오기

```
curl -X GET "http://localhost:6969/next/users"

```

### 유저 생성

```
curl -X POST "http://localhost:6969/next/users" -H "Content-Type: application/json" -d '{"name": "John Doe", "email": "john@example.com", "password": "mypassword"}'

```

### 최신 인보이스 가져오기

```
curl -X GET "http://localhost:6969/next/latest-invoices"

```

---

## 기타

- 데이터베이스에 연결하기 위한 설정은 `.env` 파일에 `POSTGRES_URL`을 사용합니다.
- 모든 엔드포인트는 `/next` 경로를 사용하며, 유저 및 인보이스 데이터를 관리할 수 있습니다.

---
