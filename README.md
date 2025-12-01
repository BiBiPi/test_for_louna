## Тестовое задание в DataLouna.io

> Для удобства разбил на два сервиса `/service1` - выгрузка скинов, `/service2` - сервис с базой.

Запуск инфраструктуры `docker compose up --build`.

Отдельный запуск __Redis__ в докере:

```bach
docker run -d --name redis -p 6379:6379 redis:alpine3.22
```

### /service1

> _Так как есть ограничение по запросам, и данных обновляються раз в 5 минут, я сделал преодический опрос с записью в кэш._

Запрос на получение скинов с ценами:

```bash
curl localhost:3000/skins
```

Вернет массив с объектами:

```typescript
interface SkinPrice {
  name: string
  min_price_tradable: number | null
  min_price_not_tradable: number | null
  created_at: number
}
```