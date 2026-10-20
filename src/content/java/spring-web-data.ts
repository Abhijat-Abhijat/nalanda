import type { Chapter } from '../../schema';
import { choice, fill, order } from '../helpers';
import { deepTopic } from '../cs/h';

export const sbWebData: Chapter = {
  id: 'sb-web-data',
  title: 'Spring Web and Data: REST, JPA, transactions, and migrations',
  summary: 'Building data-backed REST services with Spring: HTTP semantics in controllers, request validation, Spring Data JPA repositories and derived queries, the persistence context and dirty checking, transaction boundaries and rollback rules, N+1 queries, pagination at scale, and schema migrations with Flyway. Versions checked as of October 2026 (Spring Boot 4.x, Hibernate 7, Jakarta Persistence 3.2).',
  lessons: [
    deepTopic({
      id: 'l1', key: 'sb-wd-1', title: 'REST controllers and HTTP semantics', concept: 'jv-rest',
      story: "Roy Fielding described REST in his 2000 doctoral dissertation as the architectural style of the web: resources identified by URIs, manipulated through a uniform interface of HTTP methods, with status codes that tell clients what happened. Many \"REST APIs\" ignore those semantics: every response is `200 OK` with an error flag in the body, or `POST` is used for everything. Spring MVC makes correct HTTP easy with `@RestController`, `ResponseEntity`, and centralised error handling, and HTTP's semantics are now consolidated in RFC 9110 (2022).",
      analogy: "A post office counter with clear stamps: \"delivered\", \"accepted for processing\", \"no such address\", \"form filled in wrongly\". Clients act on the stamp without reading the letter.",
      timeline: [['2000', 'REST dissertation', 'Fielding describes the style of the web.'], ['2009', 'Spring 3 REST support', '@ResponseBody, @PathVariable, content negotiation.'], ['2014', '@RestController', 'Combined annotation (Spring 4).'], ['June 2022', 'RFC 9110', 'HTTP Semantics consolidated.']],
      explain: "Map operations to methods: `GET` reads (safe and idempotent), `POST` creates or triggers actions (not idempotent), `PUT` replaces (idempotent), `PATCH` partially updates, `DELETE` removes (idempotent). Return status codes that describe outcomes: **201 Created** with a `Location` header after creating, **200 OK** with a body for reads and updates, **204 No Content** after a successful delete or an update without body, **400 Bad Request** for invalid input, **404 Not Found** for missing resources, **409 Conflict** for state conflicts (duplicates, optimistic locking), **422** for semantically invalid requests where teams choose it, **401/403** for authentication and authorisation, and **5xx** only for server faults. In Spring: `@RestController`, `@GetMapping(\"/orders/{id}\")`, `@PathVariable`, `@RequestParam`, `@RequestBody`, and `ResponseEntity` for full control of status and headers. Return **DTOs** (records), not JPA entities, so the API contract is independent of the database schema and lazy-loading surprises.",
      diagram: "POST   /orders          → 201 Created, Location: /orders/42\nGET    /orders/42       → 200 OK (or 404)\nPUT    /orders/42       → 200 OK (or 409 on version conflict)\nDELETE /orders/42       → 204 No Content\ninvalid body            → 400 with Problem Details",
      ex1: ['java', 'a controller with correct status codes', "@RestController\n@RequestMapping(\"/orders\")\nclass OrderController {\n    @PostMapping\n    ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrder req) {\n        OrderDto created = service.create(req);\n        return ResponseEntity.created(URI.create(\"/orders/\" + created.id())).body(created);\n    }\n    @GetMapping(\"/{id}\") OrderDto get(@PathVariable long id) { return service.get(id); }   // 404 via exception handler\n    @DeleteMapping(\"/{id}\") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable long id) { service.delete(id); }\n}"],
      ex2: ['text', 'idempotency keys for safe retries', "POST /payments\nIdempotency-Key: 7f9c2ba4-…\n# server stores the key with the result; a retried request returns the same result instead of charging twice"],
      deepDive: {
        explain: "Idempotency matters because networks fail: clients retry, and retries of non-idempotent operations duplicate orders or payments. Make retries safe with **idempotency keys** (a client-generated id stored with the result) or natural keys. Version APIs deliberately (URI versions, headers, or additive evolution with tolerant readers) and never break existing clients silently. Use **Problem Details** (RFC 9457) for errors, as covered in the exceptions chapter. Avoid exposing entities: they leak internal fields, trigger lazy loading during serialisation (and the N+1 problem), and couple clients to your schema. Document the API with OpenAPI (springdoc-openapi) generated from code or written first, and test controllers with `@WebMvcTest` slices. For long operations, return **202 Accepted** with a status resource instead of blocking.",
        example: ['js', 'choosing a status code from method and outcome', "function statusFor(method, outcome) {\n  if (outcome === 'created') return 201;\n  if (outcome === 'ok') return method === 'DELETE' ? 204 : 200;\n  if (outcome === 'notFound') return 404;\n  if (outcome === 'invalid') return 400;\n  if (outcome === 'conflict') return 409;\n  return 500;\n}"],
        tradeoffs: [['Choice', 'Strength', 'Weakness'], ['DTO records', 'Stable contract, no lazy loading', 'Mapping code'], ['Entities as responses', 'Less code', 'Leaks schema; N+1; accidental fields'], ['Idempotency keys', 'Safe retries for POST', 'Storage and expiry'], ['202 + status resource', 'Long operations without timeouts', 'Polling or callbacks needed']],
        failures: [['Clients cannot tell errors apart', '200 with error flags', 'Proper status codes and Problem Details'], ['Duplicate payments after timeouts', 'Retried non-idempotent POST', 'Idempotency keys'], ['Password hash appears in API responses', 'Serialising entities', 'DTOs with explicit fields'], ['LazyInitializationException during JSON rendering', 'Entity with lazy associations returned', 'Map to DTOs inside the transaction']],
      },
      warn: "Never return JPA entities directly from controllers. They leak internal fields such as password hashes or flags, and they trigger lazy loading at serialisation time.",
      production: {
        numbers: "Typical status distribution for a healthy API is dominated by 2xx with some 4xx; any sustained 5xx rate above a fraction of a percent deserves an alert.",
        observe: "Metrics per endpoint and status code (Micrometer http.server.requests), latency percentiles, and error rates by Problem Details type.",
        security: "Validate all input, return only needed fields, enforce authorisation per resource (not just per endpoint), and do not reveal whether forbidden resources exist.",
        checklist: ['Methods match semantics', 'Correct status codes, Location on 201', 'DTOs instead of entities', 'Idempotency for retried creates', 'Problem Details errors', 'OpenAPI documentation', '@WebMvcTest controller tests'],
        sources: ['Fielding, "Architectural Styles and the Design of Network-based Software Architectures" (2000)', 'RFC 9110: HTTP Semantics (2022)', 'Spring Framework reference: Web MVC annotated controllers'],
      },
      tip: "Read your API's responses with curl and ignore the body: if the status code and headers alone tell you what happened, the API speaks HTTP.",
      faq: [['Status after creating a resource?', '201 Created with a Location header.'], ['Status after a successful DELETE?', 'Usually 204 No Content.'], ['Which methods are idempotent?', 'GET, PUT, DELETE (and HEAD, OPTIONS).'], ['Why return DTOs?', 'Stable contracts and no leaked fields or lazy loading.'], ['How do you make POST retries safe?', 'Idempotency keys.']],
      ex: { prompt: 'Write statusFor(method, outcome): "created" → 201; "ok" → 204 for DELETE, else 200; "notFound" → 404; "invalid" → 400; "conflict" → 409; anything else → 500.', fn: 'statusFor', params: 'method, outcome', sig: '(string method, string outcome) -> int', java: `class Solution {
    public int statusFor(String method, String outcome) {
        switch (outcome) {
            case "created": return 201;
            case "ok": return method.equals("DELETE") ? 204 : 200;
            case "notFound": return 404;
            case "invalid": return 400;
            case "conflict": return 409;
            default: return 500;
        }
    }
}
`, cases: [{ args: ['POST', 'created'], expect: 201 }, { args: ['DELETE', 'ok'], expect: 204 }, { args: ['GET', 'ok'], expect: 200 }, { args: ['GET', 'notFound'], expect: 404 }, { args: ['PUT', 'conflict'], expect: 409 }, { args: ['POST', 'invalid'], expect: 400 }], solution: `function statusFor(m,o){if(o==='created')return 201;if(o==='ok')return m==='DELETE'?204:200;if(o==='notFound')return 404;if(o==='invalid')return 400;if(o==='conflict')return 409;return 500}`, hint: 'Map outcomes; DELETE success has no content.' },
      quiz: [
        choice('sb-wd-1-q1', 'jv-rest', 'An API returns 200 with {"error": true} for missing orders. Better?', ['404 with Problem Details', '200 is fine', '500', '302'], 0, 'Semantics.'),
        choice('sb-wd-1-q2', 'jv-rest', 'A client retries POST /payments after a timeout. Protection?', ['idempotency key', 'longer timeout only', 'GET instead', 'nothing'], 0, 'Safe retries.'),
        choice('sb-wd-1-q3', 'jv-rest', 'Which method is not idempotent?', ['POST', 'PUT', 'DELETE', 'GET'], 0, 'Creates.'),
        fill('sb-wd-1-q4', 'jv-rest', 'HTTP semantics are defined in RFC ___', ['9110'], '2022.'),
      ],
    }),
    deepTopic({
      id: 'l2', key: 'sb-wd-2', title: 'Request validation', concept: 'jv-validation',
      story: "Every API boundary is a trust boundary: request bodies arrive from browsers, mobile apps, partners, and attackers. Bean Validation (JSR 303, 2009, now Jakarta Validation) let Java developers declare constraints on fields (`@NotBlank`, `@Email`, `@Size`, `@Min`) and validate objects with one call; Hibernate Validator is the reference implementation. Spring integrates it so `@Valid` on a controller parameter rejects invalid requests with a 400 before your code runs.",
      analogy: "A bouncer with a checklist at the door: no ticket, wrong date, or under age, and you are turned away before you reach the bar.",
      timeline: [['2009', 'JSR 303 Bean Validation', 'Declarative constraints for Java objects.'], ['2017', 'Bean Validation 2.0', 'Container element constraints, Java 8 types.'], ['2020', 'Jakarta Validation 3.0', 'jakarta.validation namespace.'], ['2023–2025', 'Validation 3.1', 'Jakarta EE 11 alignment, records support.']],
      explain: "Annotate request DTOs (records work well): `record CreateOrder(@NotBlank @Email String email, @Min(1) @Max(100) int quantity, @NotBlank @Size(max = 32) String sku, @Valid @NotEmpty List<LineItem> items) {}`. In the controller, `@Valid @RequestBody CreateOrder req` triggers validation; failures raise `MethodArgumentNotValidException`, which Spring maps to **400** (customise with `@RestControllerAdvice` to return Problem Details listing each invalid field). Validate path and query parameters with `@Validated` on the controller and constraints on parameters. Use **custom constraints** for business formats (SKU patterns, IBANs) and **class-level constraints** for cross-field rules (start date before end date). Distinguish **input validation** (shape, format, ranges: at the boundary) from **business validation** (stock available, customer not blocked: in the service, with domain errors such as 409 or 422). Validation complements, never replaces, parameterised queries, output encoding, and authorisation.",
      diagram: "request JSON → deserialise → @Valid constraints\n  email \"bad\"      → @Email fails\n  quantity 0        → @Min(1) fails\n  sku \"  \"         → @NotBlank fails\n→ 400 Problem Details { errors: [email, quantity, sku] } before the service is called",
      ex1: ['java', 'a validated request record', "public record CreateOrder(\n    @NotBlank @Email String email,\n    @Min(1) @Max(100) int quantity,\n    @NotBlank @Pattern(regexp = \"[A-Z0-9-]{3,32}\") String sku) {}\n\n@PostMapping(\"/orders\")\nResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrder req) { … }"],
      ex2: ['json', 'a field-level error response', "{\n  \"type\": \"https://api.example.com/problems/validation\",\n  \"title\": \"Invalid request\",\n  \"status\": 400,\n  \"errors\": [ { \"field\": \"email\", \"message\": \"must be a well-formed email address\" },\n              { \"field\": \"quantity\", \"message\": \"must be greater than or equal to 1\" } ]\n}"],
      deepDive: {
        explain: "Return **all** field errors at once, so clients can fix a form in one round trip. Keep messages user-safe (no internal details) and machine-readable (field names, codes) so front ends can localise them. Be strict on input: reject unknown JSON properties where appropriate (`FAIL_ON_UNKNOWN_PROPERTIES`), cap sizes of strings, lists, and request bodies to prevent resource exhaustion, and normalise inputs (trim, case-fold emails) consistently. Beware `@Email` permissiveness and regex catastrophic backtracking in `@Pattern` with untrusted input. Validation groups exist for different rules on create and update, but separate request DTOs per operation are usually clearer. Method-level validation (`@Validated` on services) can enforce invariants across layers, but keep the main gate at the API boundary.",
        example: ['js', 'field-level validation returning all failing fields', "function validateOrder(email, qty, sku) {\n  const errors = [];\n  const at = email.indexOf('@');\n  if (at < 1 || email.indexOf('.', at) < 0) errors.push('email');   // simplified email check\n  if (qty < 1 || qty > 100) errors.push('quantity');\n  if (sku.trim() === '') errors.push('sku');\n  return errors;\n}"],
        tradeoffs: [['Where', 'Validates', 'Example'], ['DTO constraints at the boundary', 'Shape, format, ranges', '@NotBlank, @Email, @Size'], ['Custom and class-level constraints', 'Formats and cross-field rules', 'SKU pattern, date ranges'], ['Service / domain', 'Business rules needing state', 'Stock, credit limits'], ['Database constraints', 'Last line of defence', 'NOT NULL, UNIQUE, CHECK']],
        failures: [['Client fixes one error, then sees the next', 'Returning only the first error', 'Return all field errors'], ['Huge payload exhausts memory', 'No size limits', 'Max sizes on strings, lists, and bodies'], ['Duplicate emails despite validation', 'Uniqueness checked only in code', 'Unique constraint in the database'], ['Regex validation hangs CPU', 'Catastrophic backtracking', 'Simple patterns; length limits first']],
      },
      warn: "Validation is not a security control on its own. It narrows input, but you still need parameterised queries, output encoding, authorisation checks, and database constraints.",
      production: {
        numbers: "Rejecting invalid requests at the boundary costs microseconds; letting them reach the database costs a round trip and can corrupt data if constraints are missing.",
        observe: "Count 400 responses by endpoint and field; spikes reveal client bugs, contract changes, or probing.",
        security: "Cap request sizes, avoid regexes vulnerable to ReDoS on untrusted input, and normalise identifiers before comparing them.",
        checklist: ['@Valid on request bodies', 'All field errors returned', 'Size limits on strings, lists, bodies', 'Custom constraints for formats', 'Business rules in services', 'Database constraints as backstop', 'Safe, localisable messages'],
        sources: ['Jakarta Validation specification 3.1', 'Hibernate Validator reference guide', 'Spring Framework reference: Validation in Web MVC'],
      },
      tip: "Put the uniqueness rule in a database constraint even if you check it in code. Two concurrent requests will eventually slip past the code check.",
      faq: [['What triggers validation in a controller?', '@Valid on the parameter.'], ['Which status for validation failures?', '400.'], ['Where do business rules belong?', 'In the service or domain layer.'], ['How do you validate cross-field rules?', 'Class-level constraints.'], ['Why database constraints too?', 'They catch races and bypasses.']],
      ex: { prompt: 'Write validateOrder(email, qty, sku) returning failing field names in order: "email" unless it has an "@" after the first character and a "." somewhere after the "@"; "quantity" unless 1 ≤ qty ≤ 100; "sku" if it is blank after trimming.', fn: 'validateOrder', params: 'email, qty, sku', sig: '(string email, int qty, string sku) -> string[]', java: `class Solution {
    public String[] validateOrder(String email, int qty, String sku) {
        List<String> e = new ArrayList<>();
        int at = email.indexOf('@');
        if (at < 1 || email.indexOf('.', at) < 0) e.add("email");
        if (qty < 1 || qty > 100) e.add("quantity");
        if (sku.trim().isEmpty()) e.add("sku");
        return e.toArray(new String[0]);
    }
}
`, cases: [{ args: ['asha@example.com', 2, 'SKU-1'], expect: [] }, { args: ['bad', 0, ' '], expect: ['email', 'quantity', 'sku'] }, { args: ['a@b', 101, 'X'], expect: ['email', 'quantity'] }], solution: `function validateOrder(email,qty,sku){const e=[];const at=email.indexOf('@');if(at<1||email.indexOf('.',at)<0)e.push('email');if(qty<1||qty>100)e.push('quantity');if(sku.trim()==='')e.push('sku');return e}`, hint: 'Collect every failing field.' },
      quiz: [
        choice('sb-wd-2-q1', 'jv-validation', 'Where should "stock must be available" be checked?', ['in the service, with current state', 'with @Min on the DTO', 'in JavaScript only', 'nowhere'], 0, 'Business rule.'),
        choice('sb-wd-2-q2', 'jv-validation', 'Two concurrent signups pass a code-level unique email check. Backstop?', ['unique constraint in the database', 'longer validation', '@Email', 'retry'], 0, 'Races.'),
        choice('sb-wd-2-q3', 'jv-validation', 'Best error response for a form with three invalid fields?', ['400 listing all three fields', '400 with the first only', '500', '200 with a message'], 0, 'One round trip.'),
        fill('sb-wd-2-q4', 'jv-validation', 'Trigger validation of a request body with @___', ['Valid'], 'Boundary.'),
      ],
    }),
    deepTopic({
      id: 'l3', key: 'sb-wd-3', title: 'Spring Data JPA repositories and derived queries', concept: 'jv-spring-data',
      story: "Writing the same DAO methods (find by id, save, delete, find by status) for every entity was a staple of early 2000s Java. Oliver Gierke's Spring Data JPA (2011) replaced them with **repository interfaces**: declare `interface OrderRepository extends JpaRepository<Order, Long>` and a method named `findByCustomerIdAndStatusOrderByCreatedAtDesc`, and Spring generates the implementation by parsing the method name into a query. The convenience is real, and so are the traps: long method names, unexpected queries, and performance problems hidden behind innocent-looking calls.",
      analogy: "A librarian who understands requests phrased in a fixed grammar: \"books by author X and genre Y, newest first\" is understood instantly, but a request in free prose needs a written query slip.",
      timeline: [['2006', 'JPA 1.0', 'Standard persistence API (EJB 3.0, JSR 220).'], ['2011', 'Spring Data JPA', 'Repository interfaces and derived queries.'], ['2014', 'Spring Boot starter', 'spring-boot-starter-data-jpa auto-configuration.'], ['2024–2025', 'Jakarta Persistence 3.2, Hibernate 7', 'Baseline for Spring Boot 4.']],
      explain: "A repository interface extending `JpaRepository<T, ID>` provides CRUD, paging, and sorting. **Derived queries** come from method names: a subject (`findBy`, `existsBy`, `countBy`, `deleteBy`), property expressions joined by `And`/`Or`, operators (`Between`, `LessThan`, `Like`, `In`, `IsNull`), and an optional `OrderBy…Asc/Desc`. Property names map to entity attributes, which map to columns (often snake case). For anything non-trivial, write **`@Query`** with JPQL or native SQL, which is clearer than a 60-character method name. Return **projections** (interfaces or records with only needed fields) for read-heavy endpoints to avoid loading full entities. Use `Optional<T>` for single results and `Page<T>`/`Slice<T>` with `Pageable` for lists. Custom implementations (`OrderRepositoryCustom` plus `Impl`) cover queries that need Criteria API or jOOQ-style building.",
      diagram: "findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, status)\n  subject: findBy\n  criteria: customerId = ? AND status = ?\n  order: createdAt DESC\n→ WHERE customer_id = ? AND status = ? ORDER BY created_at DESC",
      ex1: ['java', 'derived queries, @Query, and projections', "interface OrderRepository extends JpaRepository<Order, Long> {\n    List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(String customerId, Status status);\n    boolean existsByExternalRef(String ref);\n\n    @Query(\"select o.id as id, o.total as total from Order o where o.createdAt >= :since\")\n    List<OrderSummary> summariesSince(@Param(\"since\") Instant since);   // projection: only two columns\n}"],
      ex2: ['text', 'seeing the SQL', "spring.jpa.show-sql=false                 # avoid in production\nlogging.level.org.hibernate.SQL=debug     # SQL statements\nlogging.level.org.hibernate.orm.jdbc.bind=trace   # bound parameters (dev only)"],
      deepDive: {
        explain: "Repositories make queries easy to write and easy to forget: a `findAll()` on a table that grows to millions of rows, a derived `deleteBy` that loads every entity before deleting it one by one, or `existsBy` versus `countBy` (exists can stop at the first row). Inspect the SQL Hibernate generates in tests (statement logging, datasource-proxy, or Hibernate statistics) and assert query counts for critical paths. Indexes must match query predicates and sort order: a derived query filtering on `customer_id` and `status` ordered by `created_at` wants a composite index on those columns. For reporting and complex SQL, consider native queries, jOOQ, or Spring's `JdbcClient` alongside JPA; ORMs are best for loading and changing aggregates, not for analytics. Keep repositories thin and domain logic in services or entities.",
        example: ['js', 'turning a derived query method name into SQL', "const snake = (s) => [...s].map((c, i) => (c >= 'A' && c <= 'Z' ? (i ? '_' : '') + c.toLowerCase() : c)).join('');\nfunction derivedQuery(name) {\n  let rest = name.slice(6), order = '';                      // drop 'findBy'\n  const oi = rest.indexOf('OrderBy');\n  if (oi >= 0) { order = rest.slice(oi + 7); rest = rest.slice(0, oi); }\n  let sql = 'WHERE ' + rest.split('And').map((f) => snake(f) + ' = ?').join(' AND ');\n  if (order) {\n    let dir = 'ASC';\n    if (order.endsWith('Desc')) { dir = 'DESC'; order = order.slice(0, -4); }\n    else if (order.endsWith('Asc')) order = order.slice(0, -3);\n    sql += ' ORDER BY ' + snake(order) + ' ' + dir;\n  }\n  return sql;\n}"],
        tradeoffs: [['Query style', 'Strength', 'Weakness'], ['Derived methods', 'Zero boilerplate for simple queries', 'Unreadable when complex'], ['@Query JPQL', 'Explicit, portable', 'Strings checked at startup only'], ['Native SQL', 'Full database features', 'Database-specific'], ['Projections', 'Less data loaded', 'More types']],
        failures: [['Endpoint slows as data grows', 'findAll without paging', 'Pageable and limits'], ['Bulk delete takes minutes', 'Derived deleteBy loads and deletes one by one', '@Modifying @Query delete'], ['Query does a full table scan', 'No index for predicates and order', 'Composite index matching the query'], ['Unreadable 80-character method names', 'Overusing derived queries', '@Query with a clear name']],
      },
      warn: "Derived deleteBy methods load each entity and delete it individually. For bulk deletes, use a @Modifying @Query, and remember it bypasses entity callbacks and the persistence context.",
      production: {
        numbers: "findByCustomerIdAndStatusOrderByCreatedAtDesc becomes WHERE customer_id = ? AND status = ? ORDER BY created_at DESC; without an index on (customer_id, status, created_at), it scans.",
        observe: "Enable slow query logs in the database, Hibernate statistics in tests, and per-endpoint query counts; check execution plans for hot queries.",
        security: "Derived and @Query parameters are bound safely; never concatenate user input into native query strings, and allow-list sortable fields for Pageable sort parameters.",
        checklist: ['Derived queries only for simple cases', '@Query for anything complex', 'Projections for read-heavy endpoints', 'Pageable for lists', 'Indexes matching predicates and order', 'Bulk operations via @Modifying queries', 'SQL inspected in tests'],
        sources: ['Spring Data JPA reference: Query Methods and Projections', 'Jakarta Persistence 3.2 specification', 'Hibernate ORM 7 user guide'],
      },
      tip: "For every new repository method on a hot path, look at the generated SQL and its execution plan once. It takes five minutes and prevents most ORM performance incidents.",
      faq: [['What is a derived query?', 'A query generated from the repository method name.'], ['When should you use @Query?', 'When the method name gets long or the query is complex.'], ['What is a projection?', 'A type with only the needed fields.'], ['How do you page results?', 'Pageable parameters returning Page or Slice.'], ['Risk of derived deleteBy?', 'It loads and deletes entities one by one.']],
      ex: { prompt: 'Write derivedQuery(name) for methods like "findByCustomerIdAndStatusOrderByCreatedAtDesc": drop "findBy"; if "OrderBy" appears, split there; criteria are split on "And", each converted from camel case to snake case as "col = ?" and joined with " AND " after "WHERE "; the order part ends with "Desc" (DESC) or "Asc"/nothing (ASC) and is appended as " ORDER BY col DIR".', fn: 'derivedQuery', params: 'name', sig: '(string name) -> string', java: `class Solution {
    static String snake(String s) {
        StringBuilder o = new StringBuilder();
        for (char ch : s.toCharArray()) {
            if (Character.isUpperCase(ch)) { if (o.length() > 0) o.append('_'); o.append(Character.toLowerCase(ch)); }
            else o.append(ch);
        }
        return o.toString();
    }
    public String derivedQuery(String name) {
        String rest = name.substring(6), order = "";
        int oi = rest.indexOf("OrderBy");
        if (oi >= 0) { order = rest.substring(oi + 7); rest = rest.substring(0, oi); }
        List<String> parts = new ArrayList<>();
        for (String f : rest.split("And")) parts.add(snake(f) + " = ?");
        String sql = "WHERE " + String.join(" AND ", parts);
        if (!order.isEmpty()) {
            String dir = "ASC";
            if (order.endsWith("Desc")) { dir = "DESC"; order = order.substring(0, order.length() - 4); }
            else if (order.endsWith("Asc")) order = order.substring(0, order.length() - 3);
            sql += " ORDER BY " + snake(order) + " " + dir;
        }
        return sql;
    }
}
`, cases: [{ args: ['findByCustomerIdAndStatusOrderByCreatedAtDesc'], expect: 'WHERE customer_id = ? AND status = ? ORDER BY created_at DESC' }, { args: ['findByEmail'], expect: 'WHERE email = ?' }, { args: ['findByStatusOrderByTotalAsc'], expect: 'WHERE status = ? ORDER BY total ASC' }], solution: `function derivedQuery(name){const snake=s=>{let o='';for(const ch of s){if(ch>='A'&&ch<='Z'){if(o)o+='_';o+=ch.toLowerCase()}else o+=ch}return o};let rest=name.slice(6);let order='';const oi=rest.indexOf('OrderBy');if(oi>=0){order=rest.slice(oi+7);rest=rest.slice(0,oi)}let out='WHERE '+rest.split('And').map(f=>snake(f)+' = ?').join(' AND ');if(order){let dir='ASC';if(order.endsWith('Desc')){dir='DESC';order=order.slice(0,-4)}else if(order.endsWith('Asc'))order=order.slice(0,-3);out+=' ORDER BY '+snake(order)+' '+dir}return out}`, hint: 'Split off OrderBy, then split criteria on And, then convert names.' },
      quiz: [
        choice('sb-wd-3-q1', 'jv-spring-data', 'A derived method name reaches 90 characters. Better?', ['@Query with a short descriptive name', 'keep extending it', 'native SQL concatenation', 'findAll and filter in Java'], 0, 'Readability.'),
        choice('sb-wd-3-q2', 'jv-spring-data', 'Need only id and total for a list endpoint. Use...', ['a projection', 'the full entity', 'findAll', 'a native update'], 0, 'Less data.'),
        choice('sb-wd-3-q3', 'jv-spring-data', 'existsByEmail versus countByEmail > 0?', ['exists can stop at the first match', 'identical always', 'count is faster', 'exists loads entities'], 0, 'Short-circuit.'),
        fill('sb-wd-3-q4', 'jv-spring-data', 'Page through results by passing a ___able parameter', ['Page'], 'Pageable.'),
      ],
    }),
    deepTopic({
      id: 'l4', key: 'sb-wd-4', title: 'Entities, the persistence context, and dirty checking', concept: 'jv-jpa-entities',
      story: "Gavin King started Hibernate in 2001 as an alternative to EJB 2 entity beans, and its design became the Java Persistence API in 2006. Its central idea surprises newcomers: you rarely call `update`. Load an entity in a transaction, change its fields, and at commit Hibernate **flushes** the differences automatically through **dirty checking**. The same mechanism explains `LazyInitializationException`, unexpected UPDATE statements, and memory growth in batch jobs.",
      analogy: "Editing a shared document in a word processor with change tracking: you just edit, and when you click save, only the tracked changes are sent.",
      timeline: [['2001', 'Hibernate', 'Gavin King\'s object-relational mapper.'], ['2006', 'JPA 1.0', 'Standardised persistence context and entities.'], ['2009', 'JPA 2.0', 'Criteria API, orphan removal.'], ['2025', 'Hibernate 7', 'Jakarta Persistence 3.2 baseline (Spring Boot 4).']],
      explain: "An **entity** is a class mapped to a table (`@Entity`, `@Id`, `@GeneratedValue`, `@Column`, relationships such as `@ManyToOne` and `@OneToMany`). The **persistence context** (the `EntityManager`, scoped to a transaction in Spring) is a first-level cache and a **unit of work**: each entity is loaded at most once per context (identity guarantee), and at **flush** time (before commit, or before queries that need fresh data) Hibernate compares each managed entity with its loaded snapshot and issues UPDATE statements for changed ones. Entity states: **transient** (new, not saved), **managed** (in the context), **detached** (context closed), and **removed**. **Lazy loading**: associations marked `LAZY` (the default for collections) are loaded on first access, which works only while the context is open; accessing them after the transaction ends throws `LazyInitializationException`. Use `@Version` for **optimistic locking**: concurrent updates to the same row fail with a conflict instead of silently overwriting.",
      diagram: "tx begins → load Order#42 (snapshot: status NEW, total 10.00, note '')\norder.setStatus(PAID); order.setNote(\"gift\")\ntx commits → flush → dirty check → UPDATE orders SET status=?, note=?, version=? WHERE id=42 AND version=?\nafter tx: order.getLines() (lazy) → LazyInitializationException",
      ex1: ['java', 'an entity with optimistic locking', "@Entity\n@Table(name = \"orders\")\nclass Order {\n    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;\n    @Enumerated(EnumType.STRING) Status status;\n    BigDecimal total;\n    @Version long version;                           // optimistic locking\n    @OneToMany(mappedBy = \"order\", cascade = ALL, orphanRemoval = true)\n    List<OrderLine> lines = new ArrayList<>();       // LAZY by default\n}"],
      ex2: ['java', 'no save() needed for managed entities', "@Transactional\nvoid markPaid(long id) {\n    Order o = orders.findById(id).orElseThrow();\n    o.setStatus(Status.PAID);       // dirty checking issues the UPDATE at commit\n}"],
      deepDive: {
        explain: "Long transactions over many entities grow the persistence context (memory and slower dirty checks); in batch jobs, flush and clear periodically, or use stateless approaches (JDBC batch updates). **Open Session in View** (Spring Boot enables `spring.jpa.open-in-view` by default and logs a warning) keeps the context open during view rendering, hiding lazy loading problems while causing extra queries outside transactions and holding connections longer; most teams disable it and map to DTOs inside service transactions. `equals`/`hashCode` on entities are tricky: use a business key or an id-based implementation that handles transient entities, never all fields. `@Transactional(readOnly = true)` lets Hibernate skip dirty checking snapshots for read paths. Cascades and orphan removal should follow aggregate boundaries; cascading across aggregates causes accidental deletes and huge flushes.",
        example: ['js', 'which fields would dirty checking update?', "function dirtyFields(names, original, current) {\n  return names.filter((n, i) => original[i] !== current[i]);   // compare with the loaded snapshot\n}"],
        tradeoffs: [['Mechanism', 'Benefit', 'Cost'], ['Dirty checking', 'No explicit updates', 'Surprise UPDATEs; snapshot memory'], ['Lazy associations', 'Load only what is used', 'LazyInitializationException; N+1'], ['Optimistic locking (@Version)', 'Detects lost updates cheaply', 'Conflicts must be handled'], ['Open Session in View', 'Convenience in views', 'Hidden queries; long connection holds']],
        failures: [['Field changed but nothing saved', 'Entity detached when modified', 'Modify inside a transaction or merge'], ['LazyInitializationException in controllers', 'Lazy access after the transaction', 'Fetch needed data in the service; DTOs'], ['Batch job runs out of memory', 'Persistence context grows with every entity', 'Flush and clear in batches'], ['Two admins overwrite each other\'s edits', 'No optimistic locking', '@Version and 409 on conflict']],
      },
      warn: "Disable Open Session in View (spring.jpa.open-in-view=false) in services and load what you need inside transactions. It hides lazy-loading problems and holds database connections during rendering.",
      production: {
        numbers: "Changing two of three fields on a managed entity produces one UPDATE at commit; with dynamic updates enabled it sets only those two columns.",
        observe: "Hibernate statistics (entities loaded, flushes, queries) in tests and staging; database connection hold times; optimistic lock failure counts.",
        security: "Mass assignment risk: binding request JSON directly onto entities lets clients change fields such as role or price; map from validated DTOs explicitly.",
        checklist: ['DTOs at the API boundary', 'Open Session in View disabled', '@Version on frequently edited entities', 'readOnly transactions for reads', 'Flush/clear in batch jobs', 'Cascades within aggregates only', 'Careful entity equals/hashCode'],
        sources: ['Jakarta Persistence 3.2 specification: persistence context and flush', 'Hibernate ORM 7 user guide: dirty checking, optimistic locking', 'Spring Boot reference: spring.jpa.open-in-view'],
      },
      tip: "If you see a save() call on an entity loaded in the same transaction, it is redundant. Understanding why is the key to understanding JPA.",
      faq: [['What is dirty checking?', 'Comparing managed entities with snapshots at flush and issuing updates.'], ['When does flush happen?', 'Before commit and before queries that need it.'], ['Cause of LazyInitializationException?', 'Accessing a lazy association after the context closed.'], ['What does @Version do?', 'Optimistic locking with a version column.'], ['Why disable Open Session in View?', 'Hidden queries and long-held connections.']],
      ex: { prompt: 'Write dirtyFields(names, original, current) returning the field names whose current value differs from the original snapshot, in order.', fn: 'dirtyFields', params: 'names, original, current', sig: '(string[] names, string[] original, string[] current) -> string[]', java: `class Solution {
    public String[] dirtyFields(String[] names, String[] original, String[] current) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < names.length; i++) if (!original[i].equals(current[i])) out.add(names[i]);
        return out.toArray(new String[0]);
    }
}
`, cases: [{ args: [['status', 'total', 'note'], ['NEW', '10.00', ''], ['PAID', '10.00', 'gift']], expect: ['status', 'note'] }, { args: [['a'], ['1'], ['1']], expect: [] }], solution: `function dirtyFields(names,original,current){return names.filter((n,i)=>original[i]!==current[i])}`, hint: 'Compare position by position.' },
      quiz: [
        choice('sb-wd-4-q1', 'jv-jpa-entities', 'In a @Transactional method, an entity is loaded and its status changed. Needed to persist?', ['nothing; dirty checking flushes at commit', 'save()', 'merge()', 'flush() always'], 0, 'Unit of work.'),
        choice('sb-wd-4-q2', 'jv-jpa-entities', 'LazyInitializationException in a controller after calling a service. Fix?', ['load needed data in the service and return a DTO', 'enable OSIV forever', 'make everything EAGER', 'catch and ignore'], 0, 'Boundaries.'),
        choice('sb-wd-4-q3', 'jv-jpa-entities', 'Prevent lost updates between two editors:', ['@Version optimistic locking', 'synchronized methods', 'bigger pool', 'readOnly'], 0, 'Versions.'),
        fill('sb-wd-4-q4', 'jv-jpa-entities', 'Writing pending changes to the database is called a ___', ['flush'], 'Before commit.'),
      ],
    }),
    deepTopic({
      id: 'l5', key: 'sb-wd-5', title: 'Transactions: boundaries, propagation, and rollback rules', concept: 'jv-transactions',
      story: "A payment service catches an `IOException` from a partner call, rethrows it from a `@Transactional` method, and the order is still saved as paid. The team assumed any exception rolls back the transaction. By default, Spring rolls back only on **unchecked** exceptions and errors, following the EJB convention that checked exceptions are recoverable business conditions. That rule, plus propagation and isolation settings, decides whether your data stays consistent.",
      analogy: "A bank teller's batch of slips: either every slip in the batch is posted or none is; but the teller's manual says some kinds of problems are only noted on the batch, not grounds to tear it up.",
      timeline: [['1980s', 'ACID transactions', 'Atomicity, consistency, isolation, durability formalised.'], ['2004', 'Declarative transactions', 'Spring 1.0 @Transactional-style proxies.'], ['2009', 'Spring 3 @Transactional', 'Annotation-driven configuration mainstream.'], ['2020s', 'Reactive and virtual threads', 'Transaction management for new concurrency models.']],
      explain: "`@Transactional` on a public service method (called through the proxy, see the proxies lesson) begins a transaction, binds a connection to the thread, and commits when the method returns. **Rollback rules**: by default, rollback on `RuntimeException` and `Error`; **checked exceptions commit** unless you add `rollbackFor = Exception.class` (or specific types). **Propagation**: `REQUIRED` (default: join the current transaction or start one), `REQUIRES_NEW` (suspend the current one and start an independent transaction, for example for audit logs that must survive a rollback), `MANDATORY`, `SUPPORTS`, `NOT_SUPPORTED`, `NESTED` (savepoints). **Isolation** defaults to the database's level (PostgreSQL and Oracle: READ COMMITTED; MySQL InnoDB: REPEATABLE READ). `readOnly = true` signals read paths for optimisation. Keep transactions **short**: no remote calls, sleeps, or user interaction inside them, since they hold connections and locks. Place boundaries at **service methods** that represent one business operation.",
      diagram: "@Transactional (REQUIRED)\n  throw IllegalStateException   → ROLLBACK\n  throw IOException (checked)   → COMMIT  (!) unless rollbackFor includes it\n  throw OutOfMemoryError        → ROLLBACK\nREQUIRES_NEW audit: commits even if the outer transaction rolls back",
      ex1: ['java', 'explicit rollback rules', "@Transactional(rollbackFor = Exception.class)          // roll back on checked exceptions too\npublic Receipt checkout(Cart cart) throws PaymentException {\n    Order order = orders.save(Order.from(cart));\n    Receipt r = payments.charge(order);                   // throws checked PaymentException\n    order.markPaid(r.id());\n    return r;\n}"],
      ex2: ['java', 'keeping remote calls outside the transaction', "public Receipt checkout(Cart cart) {\n    Order order = orderTx.createPending(cart);            // short transaction 1\n    Receipt r = payments.charge(order);                   // remote call, no transaction held\n    orderTx.markPaid(order.id(), r.id());                 // short transaction 2\n    return r;\n}"],
      deepDive: {
        explain: "Distributed side effects are the hard part: a transaction can roll back after you already called a payment provider or published a message. Patterns: perform remote calls outside transactions with compensating actions; use the **transactional outbox** (write the event to an outbox table in the same transaction, publish it afterwards) instead of publishing inside the transaction; and make consumers idempotent. `@TransactionalEventListener(phase = AFTER_COMMIT)` runs listeners only after a successful commit. Isolation anomalies matter for money and inventory: at READ COMMITTED, two transactions can read the same balance and both write (lost update) unless you use optimistic locking (`@Version`), `SELECT … FOR UPDATE`, or atomic SQL updates. Long transactions also bloat MVCC history in PostgreSQL and hold row locks; monitor transaction durations and idle-in-transaction sessions.",
        example: ['js', 'does Spring roll back for this exception?', "function rollsBack(kind, name, rollbackFor) {      // kind: 'unchecked' | 'checked' | 'error'\n  if (kind === 'unchecked' || kind === 'error') return true;   // default rule\n  return rollbackFor.includes(name);                          // checked: only if configured\n}"],
        tradeoffs: [['Setting', 'Use', 'Risk'], ['REQUIRED (default)', 'One business operation', 'Inner failures roll back everything'], ['REQUIRES_NEW', 'Independent audit or outbox writes', 'Extra connection; deadlock risk'], ['rollbackFor = Exception.class', 'Checked exceptions must undo work', 'Must be applied consistently'], ['readOnly = true', 'Read paths', 'Does not enforce read-only in all databases']],
        failures: [['Order saved despite payment failure', 'Checked exception committed by default', 'rollbackFor or unchecked exceptions'], ['Connection pool exhausted during partner outage', 'Remote call inside a transaction', 'Call outside; short transactions'], ['Event published but transaction rolled back', 'Publishing inside the transaction', 'Outbox or AFTER_COMMIT listeners'], ['Overdrawn balances under load', 'Lost update at READ COMMITTED', 'Optimistic locking or SELECT FOR UPDATE']],
      },
      warn: "By default, a checked exception thrown from a @Transactional method commits the transaction. If a checked exception means the operation failed, configure rollbackFor or use an unchecked exception.",
      production: {
        numbers: "A transaction holding a connection during a 2-second partner call limits throughput to about pool size ÷ 2 requests per second for that path; with a pool of 20, roughly 10 per second.",
        observe: "Transaction duration percentiles, connection pool active/pending, rollback counts by exception, and database idle-in-transaction sessions.",
        security: "Financial and inventory invariants must be enforced atomically in the database (constraints, locking, atomic updates), not only in application logic that can race.",
        checklist: ['Boundaries at service operations', 'Rollback rules explicit for checked exceptions', 'No remote calls inside transactions', 'Outbox for events', 'Optimistic locking or row locks for contended data', 'readOnly for read paths', 'Transaction durations monitored'],
        sources: ['Spring Framework reference: Declarative Transaction Management (rollback rules, propagation)', 'Gray and Reuter, "Transaction Processing: Concepts and Techniques" (1992)', 'Richardson, "Pattern: Transactional outbox" (microservices.io)'],
      },
      tip: "For each @Transactional method, ask: what if this line throws a checked exception, and what if the remote call succeeds but the commit fails? Write the answer into the code.",
      faq: [['Default rollback rule?', 'Unchecked exceptions and errors roll back; checked exceptions commit.'], ['What does REQUIRES_NEW do?', 'Suspends the current transaction and runs in a new one.'], ['Why keep transactions short?', 'They hold connections and locks.'], ['How do you publish events safely?', 'Transactional outbox or after-commit listeners.'], ['Default isolation?', 'The database default (READ COMMITTED for PostgreSQL).']],
      ex: { prompt: 'Write rollsBack(kind, name, rollbackFor) where kind is "unchecked", "checked", or "error". Unchecked exceptions and errors roll back; checked exceptions roll back only if name is in rollbackFor.', fn: 'rollsBack', params: 'kind, name, rollbackFor', sig: '(string kind, string name, string[] rollbackFor) -> bool', java: `class Solution {
    public boolean rollsBack(String kind, String name, String[] rollbackFor) {
        if (kind.equals("unchecked") || kind.equals("error")) return true;
        return Arrays.asList(rollbackFor).contains(name);
    }
}
`, cases: [{ args: ['unchecked', 'IllegalStateException', []], expect: true }, { args: ['checked', 'IOException', []], expect: false }, { args: ['checked', 'IOException', ['IOException']], expect: true }, { args: ['error', 'OutOfMemoryError', []], expect: true }], solution: `function rollsBack(kind,name,rf){if(kind==='unchecked'||kind==='error')return true;return rf.includes(name)}`, hint: 'Default rule first, then the configured list.' },
      quiz: [
        choice('sb-wd-5-q1', 'jv-transactions', 'A @Transactional method throws a checked PaymentException. Default outcome?', ['commit', 'rollback', 'retry', 'deadlock'], 0, 'Surprise.'),
        choice('sb-wd-5-q2', 'jv-transactions', 'An audit row must persist even if the business transaction rolls back:', ['REQUIRES_NEW in a separate bean', 'REQUIRED', 'readOnly', 'NOT_SUPPORTED on the business method'], 0, 'Independent tx.'),
        choice('sb-wd-5-q3', 'jv-transactions', 'Partner outage exhausts the DB pool. Cause?', ['remote call inside a transaction', 'too few threads', 'GC', 'indexes'], 0, 'Short transactions.'),
        fill('sb-wd-5-q4', 'jv-transactions', 'Write events to a table in the same transaction: transactional ___ pattern', ['outbox'], 'Reliable publishing.'),
      ],
    }),
    deepTopic({
      id: 'l6', key: 'sb-wd-6', title: 'The N+1 query problem', concept: 'jv-n-plus-one',
      story: "An order history page loads a customer's 100 orders with one query, then, while rendering, touches `order.getLines()` for each order. Hibernate lazily loads each collection with its own query: 101 queries for one page. In development with 3 orders it is invisible; in production with network latency of a millisecond per query and customers with hundreds of orders, the page takes seconds. The **N+1 problem** is the single most common ORM performance bug, and the one in this world's final challenge.",
      analogy: "Fetching groceries by driving to the shop once for the list, then once more for each item on it, instead of buying everything in one trip.",
      timeline: [['2000s', 'ORM lazy loading', 'Convenience creates hidden queries.'], ['2009', 'Fetch joins and entity graphs', 'JPA 2.0/2.1 tools to load associations together.'], ['2010s', 'Batch fetching', 'Hibernate @BatchSize and default batch fetch size.'], ['2020s', 'Query-count tests', 'Assertions on SQL statement counts in CI.']],
      explain: "N+1 happens when code loads N parent rows with one query and then triggers one more query per parent to load an association (lazy collections or lazy `@ManyToOne` proxies), often inside a loop, a mapper, or JSON serialisation. Fixes: **fetch join** (`select o from Order o join fetch o.lines where o.customerId = :c`) loads parents and children in one query; **entity graphs** (`@EntityGraph(attributePaths = \"lines\")` on a repository method) do the same declaratively; **batch fetching** (`@BatchSize(size = 25)` or `hibernate.default_batch_fetch_size`) loads lazy associations for many parents per query using `IN (…)`, turning N extra queries into about N ÷ batch size; **DTO projections** with joins load exactly the needed columns. Caveats: fetch-joining collections multiplies rows (one row per child) and cannot be combined safely with database pagination, so for paginated lists fetch parent ids first, then load children in a second query, or use batch fetching.",
      diagram: "lazy:        SELECT orders (1) + SELECT lines WHERE order_id=? × 100   → 101 queries\nbatch (25):  SELECT orders (1) + SELECT lines WHERE order_id IN (25 ids) × 4 → 5 queries\njoin fetch:  SELECT orders JOIN lines (1)                                  → 1 query (rows = lines)",
      ex1: ['java', 'fixing N+1 with an entity graph', "interface OrderRepository extends JpaRepository<Order, Long> {\n    @EntityGraph(attributePaths = \"lines\")\n    List<Order> findByCustomerId(String customerId);     // orders and lines in one query\n}"],
      ex2: ['text', 'global batch fetching', "spring.jpa.properties.hibernate.default_batch_fetch_size=25\n# lazy collections for up to 25 parents are loaded with one IN query"],
      deepDive: {
        explain: "Detect N+1 automatically: log SQL in tests and assert statement counts for critical endpoints (libraries such as datasource-proxy or Hibernate statistics make this easy), and watch production APM traces for repeated identical queries within one request. EAGER fetching is not a fix: it loads associations everywhere, often via separate queries, and makes other use cases slower. Combine strategies by use case: fetch joins or entity graphs for detail views; batch fetching as a safety net; projections for lists and reports. With pagination, `join fetch` on a collection makes Hibernate paginate in memory (it logs a warning, HHH90003004 in recent versions), which can load the whole table; use two queries instead. Also watch for N+1 in serialisation: returning entities from controllers lets Jackson trigger lazy loads, another reason to map to DTOs in the service.",
        example: ['js', 'queries executed for N parents by fetching strategy', "function queryCount(parents, strategy, batchSize) {\n  if (strategy === 'lazy') return 1 + parents;                         // the N+1 problem\n  if (strategy === 'joinFetch') return 1;\n  if (strategy === 'batch') return 1 + Math.ceil(parents / batchSize);\n  return -1;\n}"],
        tradeoffs: [['Strategy', 'Queries', 'Watch out'], ['Lazy (default for collections)', '1 + N', 'N+1 in loops and serialisation'], ['Fetch join / entity graph', '1', 'Row multiplication; no DB pagination with collections'], ['Batch fetching', '1 + N/batch', 'Still several queries'], ['DTO projection', '1', 'Custom query per view']],
        failures: [['Order history takes 4 seconds', 'Lazy lines loaded per order', 'Entity graph or join fetch'], ['Pagination loads whole table into memory', 'join fetch collection with Pageable', 'Two-step query: ids, then children'], ['Making associations EAGER slowed everything', 'Global eager loading', 'Fetch per use case'], ['N+1 only in JSON responses', 'Jackson touching lazy associations', 'Map to DTOs in the service']],
      },
      warn: "Do not fix N+1 by marking associations EAGER. That loads them everywhere, often with separate queries, and makes unrelated endpoints slower.",
      production: {
        numbers: "For 100 orders: lazy loading issues 101 queries; batch fetching with size 25 issues 5; an entity graph or fetch join issues 1. At 2 ms per round trip, 101 queries cost over 200 ms before any processing.",
        observe: "APM traces showing many identical SELECTs per request, Hibernate statistics in tests, and query-count assertions for critical endpoints.",
        security: "N+1 patterns amplify denial-of-service risk: an attacker requesting large pages multiplies queries; cap page sizes and fix fetching.",
        checklist: ['Query counts asserted for key endpoints', 'Entity graphs or fetch joins per use case', 'default_batch_fetch_size as safety net', 'No EAGER as a fix', 'Two-step queries for paginated collections', 'DTOs mapped inside services', 'Page size limits'],
        sources: ['Hibernate ORM 7 user guide: fetching strategies and batch fetching', 'Spring Data JPA reference: @EntityGraph', 'Mihalcea, "High-Performance Java Persistence" (2016)'],
      },
      tip: "Add one integration test per important list endpoint asserting the number of SQL statements. N+1 regressions then fail the build instead of paging someone at night.",
      faq: [['What is the N+1 problem?', 'One query for parents plus one query per parent for an association.'], ['How does a fetch join help?', 'Loads parents and children in one query.'], ['What does batch fetching do?', 'Loads lazy associations for many parents per query with IN.'], ['Why not EAGER?', 'It loads associations everywhere and can still use separate queries.'], ['Problem with fetch join and pagination?', 'In-memory pagination of multiplied rows.']],
      ex: { prompt: 'Write queryCount(parents, strategy, batchSize): "lazy" → 1 + parents; "joinFetch" → 1; "batch" → 1 + ceil(parents / batchSize); anything else → -1.', fn: 'queryCount', params: 'parents, strategy, batchSize', sig: '(int parents, string strategy, int batchSize) -> int', java: `class Solution {
    public int queryCount(int parents, String strategy, int batchSize) {
        if (strategy.equals("lazy")) return 1 + parents;
        if (strategy.equals("joinFetch")) return 1;
        if (strategy.equals("batch")) return 1 + (parents + batchSize - 1) / batchSize;
        return -1;
    }
}
`, cases: [{ args: [100, 'lazy', 0], expect: 101 }, { args: [100, 'joinFetch', 0], expect: 1 }, { args: [100, 'batch', 25], expect: 5 }, { args: [0, 'lazy', 0], expect: 1 }, { args: [101, 'batch', 25], expect: 6 }], solution: `function queryCount(p,s,b){if(s==='lazy')return 1+p;if(s==='joinFetch')return 1;if(s==='batch')return 1+Math.ceil(p/b);return -1}`, hint: 'One query for parents plus the extra queries per strategy.' },
      quiz: [
        choice('sb-wd-6-q1', 'jv-n-plus-one', 'Logs show 1 SELECT for orders then 200 SELECTs for lines. Name?', ['N+1 query problem', 'deadlock', 'cartesian join', 'connection leak'], 0, 'Lazy loading.'),
        choice('sb-wd-6-q2', 'jv-n-plus-one', 'Best fix for a detail view needing order lines:', ['@EntityGraph or join fetch', 'EAGER on every association', 'more connections', 'cache everything'], 0, 'Per use case.'),
        choice('sb-wd-6-q3', 'jv-n-plus-one', 'Paginated list with a fetch-joined collection warns about in-memory pagination. Fix?', ['query ids with paging, then load children separately', 'ignore it', 'larger heap', 'EAGER'], 0, 'Two steps.'),
        fill('sb-wd-6-q4', 'jv-n-plus-one', 'Hibernate setting for IN-based loading: default_batch_fetch____', ['size'], 'Safety net.'),
      ],
    }),
    deepTopic({
      id: 'l7', key: 'sb-wd-7', title: 'Pagination at scale: offset versus keyset', concept: 'jv-pagination',
      story: "An admin screen pages through orders with `?page=5000&size=20`, and each request takes seconds while the database scans hundreds of thousands of rows only to throw most away. **Offset pagination** (`LIMIT 20 OFFSET 100000`) must read and skip every earlier row. Markus Winand's \"no offset\" campaign popularised **keyset** (seek) pagination, which uses the last seen key (`WHERE id < :lastId ORDER BY id DESC LIMIT 20`) and an index to jump straight to the next page, keeping the cost constant however deep you go.",
      analogy: "Finding page 5,000 of a book by counting pages one by one from the start, versus opening it at your bookmark.",
      timeline: [['1990s', 'LIMIT/OFFSET', 'Simple paging in SQL dialects.'], ['2011', 'Spring Data Pageable', 'Page and Slice abstractions.'], ['2013', 'No-offset movement', 'Winand advocates keyset pagination.'], ['2023', 'Spring Data scrolling API', 'ScrollPosition and keyset scrolling (Spring Data 3.1).']],
      explain: "**Offset pagination**: `ORDER BY created_at DESC LIMIT 20 OFFSET page*20`. Simple, supports jumping to any page, but the database reads `offset + limit` rows for each request, so deep pages get slower linearly; results can **shift** when rows are inserted or deleted between requests (duplicates or skipped items). `Page<T>` also runs a **count** query, which is expensive on large tables. **Keyset pagination**: remember the last row's sort key (plus a unique tiebreaker such as id) and ask for rows after it: `WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20`. With a matching index, the cost is constant, results are stable under inserts, but you cannot jump to arbitrary page numbers. Use offset for small result sets and admin screens; keyset (cursor) pagination for feeds, infinite scroll, exports, and APIs over large tables. Spring Data offers `Slice<T>` (no count query) and the scrolling API with `KeysetScrollPosition`.",
      diagram: "page 5000, size 20\noffset: DB reads 5000 × 20 + 20 = 100,020 rows, returns 20\nkeyset: DB seeks via index to (lastCreatedAt, lastId), reads 20 rows, returns 20\nAPI: GET /orders?limit=20&cursor=eyJjcmVhdGVkQXQiOi4uLn0",
      ex1: ['sql', 'keyset query with a tiebreaker', "SELECT id, created_at, total\nFROM orders\nWHERE customer_id = :c\n  AND (created_at, id) < (:lastCreatedAt, :lastId)\nORDER BY created_at DESC, id DESC\nLIMIT 20;\n-- index: (customer_id, created_at DESC, id DESC)"],
      ex2: ['java', 'Spring Data keyset scrolling', "Window<Order> first = orders.findFirst20ByCustomerIdOrderByCreatedAtDescIdDesc(c, ScrollPosition.keyset());\nWindow<Order> next = orders.findFirst20ByCustomerIdOrderByCreatedAtDescIdDesc(c, first.positionAt(first.size() - 1));"],
      deepDive: {
        explain: "Opaque cursors (base64-encoded JSON of the last key values, ideally signed) keep APIs flexible: clients pass the cursor back without understanding it, and the server can change the encoding later. Always include a unique tiebreaker in the sort; sorting by a non-unique column alone gives unstable pages in both styles. Counting total results on large tables is often unnecessary: show \"more\" links instead, or approximate counts from database statistics. Sorting must match an index, including direction, or the database sorts everything before limiting. Cap the page size server-side (for example 100) and validate sort fields against an allow-list. For exports of millions of rows, stream with keyset batches rather than loading pages into memory.",
        example: ['js', 'rows the database reads: offset versus keyset', "function rowsScanned(page, size) {\n  return [page * size + size, size];    // [offset pagination, keyset pagination]\n}"],
        tradeoffs: [['Style', 'Strength', 'Weakness'], ['Offset (Page)', 'Jump to any page, total count', 'Slow deep pages; shifting results'], ['Offset (Slice)', 'No count query', 'Still slow deep pages'], ['Keyset / cursor', 'Constant cost, stable results', 'No random page jumps'], ['Streaming export', 'Handles millions of rows', 'Long-running requests']],
        failures: [['Deep pages take seconds', 'Large OFFSET', 'Keyset pagination'], ['Items appear twice while scrolling', 'Inserts shift offset pages', 'Keyset with tiebreaker'], ['Count query dominates latency', 'Page<T> on a huge table', 'Slice or approximate counts'], ['Client requests size=100000', 'No server-side cap', 'Max page size validation']],
      },
      warn: "Always cap page size on the server. A single request with size=1000000 can exhaust memory and database resources.",
      production: {
        numbers: "Page 5,000 with 20 items per page: offset pagination reads 100,020 rows; keyset reads 20 regardless of depth.",
        observe: "Query latency by page depth, slow query logs showing large OFFSET values, and count-query costs.",
        security: "Validate sort parameters against an allow-list and sign or encrypt cursors if they contain values you do not want clients to tamper with.",
        checklist: ['Keyset for large or infinite lists', 'Unique tiebreaker in sort', 'Index matching filter and order', 'Slice instead of Page when counts are unnecessary', 'Server-side max page size', 'Opaque cursors in APIs', 'Allow-listed sort fields'],
        sources: ['Winand, "We need tool support for keyset pagination" / use-the-index-luke.com (no-offset)', 'Spring Data Commons reference: Scrolling (keyset and offset)', 'PostgreSQL documentation: LIMIT and OFFSET performance notes'],
      },
      tip: "If an endpoint is ever used by infinite scroll or an export, design it with cursors from day one. Retrofitting keyset pagination later changes the API.",
      faq: [['Why is deep offset pagination slow?', 'The database reads and discards all skipped rows.'], ['What does keyset pagination use?', 'The last seen sort key and a unique tiebreaker.'], ['Downside of keyset?', 'No jumping to arbitrary pages.'], ['Page versus Slice?', 'Page runs a count query; Slice does not.'], ['Why a tiebreaker?', 'To make ordering unique and pages stable.']],
      ex: { prompt: 'Write rowsScanned(page, size) returning [offsetRows, keysetRows]: offset pagination reads page × size + size rows; keyset reads size rows.', fn: 'rowsScanned', params: 'page, size', sig: '(int page, int size) -> int[]', java: `class Solution {
    public int[] rowsScanned(int page, int size) {
        return new int[] { page * size + size, size };
    }
}
`, cases: [{ args: [0, 20], expect: [20, 20] }, { args: [5000, 20], expect: [100020, 20] }], solution: `function rowsScanned(p,s){return[p*s+s,s]}`, hint: 'Offset reads everything before the page too.' },
      quiz: [
        choice('sb-wd-7-q1', 'jv-pagination', 'An infinite-scroll feed over 50M rows. Pagination?', ['keyset with a cursor', 'offset with Page', 'load everything', 'random sampling'], 0, 'Constant cost.'),
        choice('sb-wd-7-q2', 'jv-pagination', 'Users see duplicates while paging a busy table. Cause?', ['inserts shift offset pages', 'GC', 'cache', 'DNS'], 0, 'Unstable offsets.'),
        choice('sb-wd-7-q3', 'jv-pagination', 'Avoid an expensive total count in Spring Data:', ['return Slice instead of Page', 'add an index on everything', 'cache Page', 'use offset 0'], 0, 'No count.'),
        fill('sb-wd-7-q4', 'jv-pagination', 'Pagination using the last seen key is called ___ pagination', ['keyset', 'seek', 'cursor'], 'No offset.'),
      ],
    }),
    deepTopic({
      id: 'l8', key: 'sb-wd-8', title: 'Schema migrations with Flyway', concept: 'jv-flyway',
      story: "Letting Hibernate generate the schema (`ddl-auto=update`) is convenient on day one and dangerous by month three: it never drops or renames safely, behaves differently across environments, and leaves no history. Axel Fontaine created **Flyway** in 2010 around a simple idea: versioned SQL scripts (`V1__init.sql`, `V2__add_email.sql`) applied in order and recorded in a history table. Redgate acquired Flyway in 2019. Spring Boot runs Flyway or Liquibase automatically at startup, making migrations part of every deployment.",
      analogy: "A building's renovation log: each change is numbered and recorded, so any inspector can tell exactly which work has been done and in what order.",
      timeline: [['2006', 'Liquibase', 'Changelog-based migrations (XML, YAML, SQL).'], ['2010', 'Flyway', 'Versioned SQL migrations with a history table.'], ['2014', 'Spring Boot integration', 'Migrations run on startup.'], ['2019', 'Redgate acquires Flyway', 'Commercial editions alongside the open-source core.']],
      explain: "Migrations live in `src/main/resources/db/migration`. **Versioned** files `V<version>__<description>.sql` run once each, in **version order** (compared numerically by parts: `V2` before `V10`, `V1` before `V1.1`), and are recorded with checksums in `flyway_schema_history`. **Repeatable** migrations (`R__views.sql`) rerun when their checksum changes. Rules: never edit an applied migration (its checksum changes and validation fails); add a new one instead. By default Flyway refuses **out-of-order** migrations: a pending version lower than the latest applied version (for example a long-lived branch merged late) fails validation unless `outOfOrder=true`. For **zero-downtime deployments**, use **expand and contract**: add new columns or tables in a backward-compatible way, deploy code that writes both, backfill, switch reads, and remove old columns in a later release. Set `spring.jpa.hibernate.ddl-auto=validate` (or `none`) so Hibernate checks, but never changes, the schema.",
      diagram: "applied:   V1__init, V2__add_email\navailable: V1, V2, V3__orders, V10__index\npending (numeric order): V3__orders, V10__index\nbranch adds V2.5 after V3 applied → out of order → validation fails (unless outOfOrder=true)\nexpand → migrate data → contract (across releases)",
      ex1: ['sql', 'an expand migration', "-- V12__add_customer_email.sql (expand: nullable, no default rewrite)\nALTER TABLE customers ADD COLUMN email_normalised TEXT;\nCREATE INDEX CONCURRENTLY idx_customers_email_norm ON customers (email_normalised);"],
      ex2: ['text', 'Spring Boot settings', "spring.flyway.enabled=true\nspring.flyway.locations=classpath:db/migration\nspring.jpa.hibernate.ddl-auto=validate\n# Flyway runs before the JPA EntityManagerFactory is created"],
      deepDive: {
        explain: "Large tables need care: in PostgreSQL, adding a column with a volatile default rewrites the table, `CREATE INDEX` without `CONCURRENTLY` blocks writes, and long-running migrations at startup can exceed health-check timeouts and trigger restarts. Run heavy changes as separate, monitored jobs, and note that `CREATE INDEX CONCURRENTLY` cannot run inside a transaction (Flyway supports per-script non-transactional execution). Multiple instances starting together are safe: Flyway takes a lock on the history table. Test migrations against a production-like copy (or at least production-size tables) and in CI with Testcontainers from an empty database to the latest version. Rollbacks in production are usually **roll-forward** fixes, since undoing data changes is rarely safe; keep backups and practise restores. Seed data for development belongs in separate locations or profiles, never in production migrations.",
        example: ['js', 'pending migrations in version order, rejecting out-of-order versions', "const ver = (m) => m.slice(1, m.indexOf('__')).split('.').map(Number);\nconst cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };\nfunction pendingMigrations(applied, available) {\n  const done = new Set(applied);\n  const maxApplied = applied.map(ver).reduce((m, v) => (m && cmp(m, v) > 0 ? m : v), null);\n  const pending = available.filter((m) => !done.has(m)).sort((a, b) => cmp(ver(a), ver(b)));\n  if (maxApplied && pending.some((m) => cmp(ver(m), maxApplied) < 0)) return ['OUT_OF_ORDER'];\n  return pending;\n}"],
        tradeoffs: [['Approach', 'Strength', 'Weakness'], ['Flyway SQL migrations', 'Plain SQL, simple ordering', 'Database-specific SQL'], ['Liquibase changelogs', 'Database-agnostic changes, rollbacks defined', 'More verbose'], ['ddl-auto=update', 'Zero effort', 'Unsafe, untracked; never in production'], ['Expand/contract', 'Zero-downtime changes', 'Several releases per change']],
        failures: [['Validation failed: checksum mismatch', 'Applied migration edited', 'Revert the edit; add a new migration'], ['Deploy fails after merging an old branch', 'Out-of-order version', 'Renumber or enable outOfOrder deliberately'], ['Writes blocked for minutes during deploy', 'Index creation locking a big table', 'CREATE INDEX CONCURRENTLY in a separate step'], ['Old instances crash during rollout', 'Column dropped while old code still reads it', 'Expand/contract across releases']],
      },
      warn: "Never run spring.jpa.hibernate.ddl-auto=update or create against a production database. Use versioned migrations and set ddl-auto to validate or none.",
      production: {
        numbers: "Versions compare numerically: V10 runs after V3, and V1.1 after V1; a pending V2.5 after V3 is applied is out of order and fails validation by default.",
        observe: "Migration duration per deploy, flyway_schema_history in each environment, lock waits during migrations, and startup times.",
        security: "Run migrations with a dedicated database role that has DDL rights, separate from the application's runtime role with only data permissions.",
        checklist: ['Versioned, immutable migration files', 'ddl-auto=validate or none', 'Expand/contract for breaking changes', 'Heavy DDL as separate monitored steps', 'Migrations tested in CI from scratch', 'Separate migration and runtime DB roles', 'Backups and restore drills'],
        sources: ['Flyway documentation: versioned migrations, validate, outOfOrder', 'Spring Boot reference: Database Initialization (Flyway and Liquibase)', 'Sadalage and Ambler, "Refactoring Databases" (2006)'],
      },
      tip: "Name migrations after intent (V42__add_customer_email_normalised) and keep each one small. Small migrations are easy to review, fast to run, and easy to roll forward.",
      faq: [['How are Flyway versions ordered?', 'Numerically by parts: V2 before V10.'], ['Can you edit an applied migration?', 'No; add a new one.'], ['What is expand and contract?', 'Backward-compatible schema changes spread over releases.'], ['What should ddl-auto be in production?', 'validate or none.'], ['What happens with an out-of-order version?', 'Validation fails unless outOfOrder is enabled.']],
      ex: { prompt: 'Write pendingMigrations(applied, available) for names like "V10__index" (version between "V" and "__", dot-separated numbers). Pending = available not in applied, sorted by numeric version. If any pending version is lower than the highest applied version, return ["OUT_OF_ORDER"].', fn: 'pendingMigrations', params: 'applied, available', sig: '(string[] applied, string[] available) -> string[]', java: `class Solution {
    static int[] ver(String m) {
        String[] p = m.substring(1, m.indexOf("__")).split("\\\\.");
        int[] v = new int[p.length];
        for (int i = 0; i < p.length; i++) v[i] = Integer.parseInt(p[i]);
        return v;
    }
    static int cmp(int[] a, int[] b) {
        for (int i = 0; i < Math.max(a.length, b.length); i++) {
            int d = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
            if (d != 0) return d;
        }
        return 0;
    }
    public String[] pendingMigrations(String[] applied, String[] available) {
        Set<String> done = new HashSet<>(Arrays.asList(applied));
        int[] maxApplied = null;
        for (String a : applied) if (maxApplied == null || cmp(ver(a), maxApplied) > 0) maxApplied = ver(a);
        List<String> pending = new ArrayList<>();
        for (String m : available) if (!done.contains(m)) pending.add(m);
        Collections.sort(pending, new Comparator<String>() { public int compare(String a, String b) { return cmp(ver(a), ver(b)); } });
        for (String m : pending) if (maxApplied != null && cmp(ver(m), maxApplied) < 0) return new String[] { "OUT_OF_ORDER" };
        return pending.toArray(new String[0]);
    }
}
`, cases: [{ args: [['V1__init', 'V2__add_email'], ['V1__init', 'V2__add_email', 'V10__index', 'V3__orders']], expect: ['V3__orders', 'V10__index'] }, { args: [['V1__init', 'V3__orders'], ['V1__init', 'V2__late', 'V3__orders']], expect: ['OUT_OF_ORDER'] }, { args: [[], ['V1.1__b', 'V1__a']], expect: ['V1__a', 'V1.1__b'] }], solution: `function pendingMigrations(applied,available){const ver=m=>m.slice(1,m.indexOf('__')).split('.').map(Number);const cmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0};const ap=new Set(applied);const maxA=applied.map(ver).reduce((m,v)=>m&&cmp(m,v)>0?m:v,null);const pend=available.filter(m=>!ap.has(m)).sort((a,b)=>cmp(ver(a),ver(b)));if(maxA&&pend.some(m=>cmp(ver(m),maxA)<0))return['OUT_OF_ORDER'];return pend}`, hint: 'Parse versions numerically; compare part by part.' },
      quiz: [
        choice('sb-wd-8-q1', 'jv-flyway', 'A teammate edited V5 after it ran in staging. Result?', ['checksum validation fails', 'it reruns', 'nothing', 'schema silently updates'], 0, 'Immutable.'),
        choice('sb-wd-8-q2', 'jv-flyway', 'Rename a column with zero downtime:', ['expand/contract over several releases', 'ALTER ... RENAME in one deploy', 'ddl-auto=update', 'drop and recreate'], 0, 'Compatibility.'),
        choice('sb-wd-8-q3', 'jv-flyway', 'Order of V2, V10, V1.1, V1?', ['V1, V1.1, V2, V10', 'V1, V10, V1.1, V2', 'V10, V2, V1.1, V1', 'alphabetical'], 0, 'Numeric.'),
        fill('sb-wd-8-q4', 'jv-flyway', 'In production set spring.jpa.hibernate.ddl-auto to ___', ['validate', 'none'], 'Never update.'),
      ],
    }),
  ],
  exam: [
    choice('sb-wd-e1', 'jv-rest', 'Correct response after creating an order:', ['201 with a Location header', '200 with no headers', '204', '302'], 0, 'Created.'),
    choice('sb-wd-e2', 'jv-validation', 'Where is "email format" validated?', ['DTO constraints at the boundary', 'only in the database', 'in the view', 'nowhere'], 0, 'Boundary.'),
    choice('sb-wd-e3', 'jv-spring-data', 'Complex query better expressed as...', ['@Query with JPQL or SQL', 'a 90-character method name', 'findAll plus Java filtering', 'reflection'], 0, 'Readability.'),
    choice('sb-wd-e4', 'jv-jpa-entities', 'A managed entity changed inside a transaction is saved...', ['automatically by dirty checking at flush', 'only after save()', 'never', 'on the next request'], 0, 'Unit of work.'),
    choice('sb-wd-e5', 'jv-transactions', 'Checked exception from @Transactional method by default...', ['commits', 'rolls back', 'retries', 'hangs'], 0, 'Rollback rules.'),
    choice('sb-wd-e6', 'jv-n-plus-one', '100 orders loaded lazily with their lines cost how many queries?', ['101', '1', '2', '100'], 0, 'N+1.'),
    choice('sb-wd-e7', 'jv-pagination', 'Constant-cost deep pagination:', ['keyset with a tiebreaker', 'large OFFSET', 'Page with count', 'random'], 0, 'Seek.'),
    choice('sb-wd-e8', 'jv-flyway', 'Hibernate ddl-auto in production:', ['validate or none', 'update', 'create-drop', 'create'], 0, 'Migrations.'),
    choice('sb-wd-e9', 'jv-transactions', 'Publish events reliably with database changes:', ['transactional outbox', 'publish inside the transaction', 'publish before saving', 'cron'], 0, 'Outbox.'),
    order('sb-wd-e10', 'jv-flyway', 'Order an expand/contract column rename.', ['Add the new column', 'Deploy code writing both columns', 'Backfill and switch reads to the new column', 'Drop the old column in a later release'], 'Zero downtime.'),
    order('sb-wd-e11', 'jv-n-plus-one', 'Order an N+1 investigation.', ['Notice slow endpoint latency', 'See repeated identical SELECTs in traces', 'Add an entity graph or fetch join', 'Assert the query count in a test'], 'Fix and guard.'),
    fill('sb-wd-e12', 'jv-jpa-entities', 'Optimistic locking uses the @___ annotation', ['Version'], 'Concurrency.'),
  ],
};
