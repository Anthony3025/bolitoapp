# ENTREGA DE AUDITORÍA — Proyecto BOLITO (segunda revisión)

**Fecha:** 15 de octubre de 2026
**Modalidad:** solo lectura. No se modificó ninguna línea de código funcional. Este documento es la única pieza nueva.
**Alcance:** working copy de `C:\TEST3` (React Native + Expo + Supabase). Revisión estructural, de seguridad y de los 7 puntos de verificación solicitados por el equipo auditor.

---

## 0. Estado del repositorio (condiciona todo lo demás)

| Verificación | Resultado |
|---|---|
| Commits / ramas / historial | **0 commits, 0 ramas.** No existe historial que auditar. La búsqueda de secretos "en historial" es imposible: el proyecto completo vive solo en el working copy de una máquina. |
| Staging (índice Git) | Limpio de secretos verificados (`git grep --cached` sin llaves). |
| Worktree (sin commitear) | **Contiene la llave privada de Google** en `.google_creds.json` y pegada en `supabase/functions/README.md:31`. **Ninguno de los dos está en `.gitignore`** (verificado con `git check-ignore`: no ignorados) → un `git add .` la publica para siempre. |
| Copia de BD de pruebas | No existe en el repo. |
| Logs de pruebas internas | No existen. |
| Pruebas automáticas | **Cero.** `package.json` no tiene scripts de test/lint/typecheck y no hay archivos `*.test.*` (glob sin resultados). |
| Backup / restore | No hay scripts, ni documentación, ni evidencia de restauración (`pg_dump`/`restore`: 0 referencias). |
| Lista de admins | No hay roles admin en el código; el acceso admin es por panel de Supabase (no verificable desde el repo). |

---

## 1. Documentación solicitada

### 1.1 Arquitectura (una página)

```
[TELÉFONO — React Native 0.81 / Expo 54]                     [NUBE]
┌────────────────────────────────────────┐        HTTPS + anon key + JWT usuario
│ 38 pantallas (src/screens)             │  ────────────────────────────────────┐
│   · Pago protegido: PaymentConfirm,    │                                      │
│     Buyer/SellerDetail, ProtectedOps   │   lógica de DINERO corre aquí        ▼
│   · Cajero: CashierDashboard/Setup     │        (NO en el servidor)   ┌──────────────────────────┐
│ 5 stores Zustand (auth/payment/…)      │                              │ SUPABASE (tgonjixsypl…)  │
│ supabase-js (REST/PostgREST)           │──escribe balance directo────►│  Postgres + RLS          │
│                                              (PaymentConfirmScreen:157)│  Auth (email trucado) │
│  Google Maps SDK ◄── app.json:24,45          │                        │  Storage kyc-documents   │
│  Biometría/ubicación (local)                 │                        │  Edge Functions (Deno)   │
└────────────────────────────────────────┘   ──invoke verify-kyc───►│   · verify-kyc           │
                                                  (sin JWT: config.toml)│   · verify-merchant-…  │
                                                                        └───────────┬──────────────┘
                                                                         RPCs del dinero (NO están en el repo):
                                                                         transfer_tokens, complete_protected_payment,
                                                                         validate_cashier_otp, process_cashier_transaction
                                                                                    │
                                                                     AWS Rekognition (CompareFaces/DetectText)
                                                                     Google Maps, Google Cloud (llave filtrada)
```

Puntos clave de comunicación:

- La app escribe **directamente** tablas y saldo con la anon key.
- Las funciones Edge se invocan desde el teléfono.
- `verify-kyc` corre **sin verificación de sesión** (`supabase/config.toml:2`) y recibe el `user_id` desde el cuerpo del request (`supabase/functions/verify-kyc/index.ts:19`).
- Los RPC del dinero (`transfer_tokens`, `complete_protected_payment`, `validate_cashier_otp`, `process_cashier_transaction`) viven en la BD de Supabase; solo `transfer_tokens` está versionado en el repo.

### 1.2 Diagrama de estados del escrow ("Pago Protegido")

Estados encontrados:

| Estado | Definido en | Persistido en BD |
|---|---|---|
| `active` (custodia) | `src/screens/PaymentConfirmScreen.tsx:171` | Sí — tabla `safety_payments` (**no existe en ningún SQL del repo**) |
| Liberado / completado | UI asume `status === 'completed'` (`src/screens/BuyerTransactionDetailScreen.tsx:13`) | RPC `complete_protected_payment` (no versionada) |
| Mediación | Solo estado local de UI (`src/screens/BuyerTransactionDetailScreen.tsx:109-112`) | **No se persiste** |
| Reembolsado | — | **No existe transición en la app** |

```
[nueva pago protegido]
      │  (comprador: insert directo + débito de su propio saldo — PaymentConfirmScreen:154-173)
      ▼
   ACTIVE ──(comprador: RPC complete_protected_payment — BuyerTransactionDetailScreen:70)──►  ¿COMPLETED?
      │
      ├─(72 h sin confirmar)──► "liberación automática" SOLO en textos de UI
      │                          (BuyerTransactionDetailScreen:321);
      │                          contador simulado en el cliente (línea 17);
      │                          NO hay cron/job en el repo.
      │
      └─(reportar problema)──► MEDIACIÓN solo en memoria del teléfono.
```

**Quién puede ejecutar cada transición:**

- Crear custodia: el comprador desde la app (insert directo desde el cliente).
- Liberar fondos: el comprador en apariencia, pero el RPC recibe `p_buyer_id`, `p_seller_id`, `p_amount` y `p_total_amount` **enviados por el cliente** (`BuyerTransactionDetailScreen.tsx:70-77`), y el SQL de ese RPC no existe en el repo: la autoridad real no es verificable.
- `transfer_tokens` (transferencias normales) **no valida quién llama** (`supabase/migrations/token_transfer_rpc.sql:2-7`): cualquiera puede pasar el `p_sender_id` de otro.

### 1.3 Esquema de base de datos realmente provisto

| Tabla | ¿En el repo? | Evidencia |
|---|---|---|
| `profiles` (cuenta: `balance DECIMAL(12,2)`) | Sí | `supabase_schema.sql:2-9` |
| `transactions` (movimientos: `amount DECIMAL(12,2)`, `status`) | Sí | `supabase_schema.sql:26-34` |
| `points` (mapa) | Sí | `supabase_schema.sql:46-54` |
| `kyc_verifications` | Sí | `supabase_kyc_setup.sql:8-33` |
| **`safety_payments` (escrow)** | **NO** | Usada en 3 pantallas: `PaymentConfirmScreen:164`, `ProtectedOperationsScreen:28,35`, `HomeScreen:171-182` |
| **`cashier_points`** | **NO** | `CashierSetupScreen:324`, `PointsDiscoveryScreen:29`, `CashierDashboardScreen:155,174,209` |
| **`cashier_transactions`** | **NO** | `PointOperationSetupScreen:81-98` |
| **`verification_logs`** | **NO** | `supabase/functions/verify-merchant-identity/index.ts:118` |

**RPCs usadas pero ausentes del SQL versionado:** `complete_protected_payment`, `validate_cashier_otp`, `process_cashier_transaction` (solo `transfer_tokens` está en `supabase/migrations/token_transfer_rpc.sql`).

Conclusión: **el corazón del dinero (escrow y cajeros) no es auditable con lo entregado**; exige la copia de la BD.

### 1.4 Inventario de datos personales

| Dato | Dónde | Finalidad | Exposición verificada |
|---|---|---|---|
| Nombre completo, teléfono, correo sintético (`celular@bolito-app.com`) | `auth.users`, `profiles` | cuenta / contacto | `profiles` es **público para todos** (`supabase_schema.sql:15-16`); búsqueda de cualquier persona por nombre/teléfono (`SendMoneyScreen:41-46`) |
| **Contraseña derivada del PIN de 4 dígitos** (`PIN+'00'`) | `auth.users` | login | ~10.000 combinaciones (`LoginScreen.tsx:133`, `RegisterScreen.tsx:174`) |
| Cédula y selfies (frente/reverso), selfie comerciante, foto de fachada | bucket `kyc-documents` | KYC | Bucket privado (bien) **pero política que expone todo a cualquier usuario** (`supabase_kyc_setup.sql:105-109`) |
| Texto OCR del CI (incluye números de documento), score facial, nombre | `kyc_verifications.extracted_data` | KYC | `USING (true)` permite a cualquiera aprobar su propio KYC (`supabase_kyc_setup.sql:66-70`); además el OCR crudo se imprime en logs (`verify-kyc/index.ts:105,155`) |
| Saldo e historial de pagos | `profiles.balance`, `transactions` | operación | saldo **editable por el dueño** (`supabase_schema.sql:21-22`); historial falso insertable (`:41-42`) |
| Ubicación del negocio (coords, dirección, horarios, fotos) | `cashier_points` (no versionada), AsyncStorage local (`cashierStore.ts:12-22,62`) | red de cajeros | esquema/RLS desconocidos |
| Ubicación del dispositivo, biometría | local (Expo), no sale del teléfono | mapa / seguridad | permisos declarados en `app.json:19-21,37-42` |

### 1.5 Servicios externos y dependencias

- **Supabase Cloud** (proyecto `tgonjixsyplqxqhnnoev`): BD, Auth, Storage, Edge Functions. URL y anon key hardcodeadas (`src/lib/supabase.ts:5-6`, duplicada en `KYCScreen.tsx:355`).
- **AWS Rekognition** (CompareFaces/DetectText) desde ambas Edge Functions; credenciales en secrets de Supabase (bien).
- **Google Maps Platform**: API key hardcodeada en `app.json:24,45` y `PointsMapScreen.tsx:11` (la del índice Git aún no la tiene, la del working copy sí).
- **Google Cloud**: cuenta de servicio `bolito-484819` — **llave privada en texto plano** en `.google_creds.json` y `supabase/functions/README.md`; el código no la usa (documentación dice Google Vision, código usa AWS).
- **Expo / EAS** (runtime y builds). **No hay** proveedor de SMS, correo ni push integrado.
- CDN de Deno (`deno.land`, `esm.sh`) en runtime de las funciones.

---

## 2. Verificaciones de la rúbrica (hechas por el auditor)

| Punto | Resultado |
|---|---|
| **Tipo de dato de montos** | Columnas son `DECIMAL(12,2)` en las 2 tablas visibles (bien), **pero la aritmética del dinero corre en floats de JS en el teléfono** (`parseFloat`/`toFixed`, `PaymentConfirmScreen.tsx:93-98,115-117`) y el saldo se escribe desde el cliente con un valor absoluto calculado localmente (`PaymentConfirmScreen.tsx:157`). Las tablas del escrow y caja no están versionadas: su tipo es desconocido. → **Incumple el criterio "sin float en montos"** tal como está implementado el camino real del dinero. |
| **Consistencia del ledger** | **No existe ledger.** El saldo es un campo único mutable, sin asientos ni trigger de cuadre versionado. La creación del escrow **no es atómica**: descuenta saldo y luego inserta; si el insert falla, el dinero queda debitado sin respaldo (el propio código lo llama "DINERO AL LIMBO", `PaymentConfirmScreen.tsx:154-179`). Además, los pagos protegidos **no generan movimiento en `transactions`** al crearse: no hay conciliación posible con lo entregado. |
| **Doble ejecución** | `transfer_tokens` usa `FOR UPDATE` y revalida saldo (`token_transfer_rpc.sql:26-30`) → las transferencias normales están serializadas. Pero la liberación del escrow y las operaciones de cajero dependen de RPCs invisibles; el cliente **no bloquea el doble toque** de "Ya recibí el producto" (`BuyerTransactionDetailScreen.tsx:60-103`, sin estado de envío) y no hay claves de idempotencia. No certificable. |
| **Transiciones ilegales** | No hay `CHECK`/máquina de estados versionada para `safety_payments` (tabla ausente). "Mediación" ni siquiera se persiste. No hay guardas verificables → **no certificable**. |
| **Autorización por objeto** | Roto en lo visible: `profiles` SELECT público con teléfono y saldo (`supabase_schema.sql:15`); `transactions` insertable a gusto (`:41-42`); escrow y caja sin RLS en repo; la liberación recibe IDs y montos del cliente. Cualquier usuario autenticado puede invocar `transfer_tokens` pasando el `p_sender_id` de otra persona (`token_transfer_rpc.sql:2-7`). |
| **Recálculo en servidor** | **No.** Comisión y total se calculan en la app (`PaymentConfirmScreen.tsx:93-98`); `transfer_tokens` acepta monto y emisor enviados por el cliente (`SendMoneyScreen.tsx:73-78`, `PaymentConfirmScreen.tsx:190-195`). |
| **Secretos en historial** | No hay historial (0 commits). Índice limpio. Working copy con llave privada de Google sin ignorar → primer `git add .` la filtra. Verificado también: el índice de `app.json` aún no tiene la Maps key, el working copy sí. |

**Hallazgos críticos adicionales encontrados en esta pasada:**

- KYC evadible en 3 caminos: política `USING (true)` (`supabase_kyc_setup.sql:66-70`); función sin JWT con `user_id` del cliente (`supabase/functions/verify-kyc/index.ts:19`, `supabase/config.toml:2`); `LoginScreen.tsx:144` fuerza `hasCompletedKyc=true`.
- Cédulas y selfies de todos visibles para cualquier usuario (`supabase_kyc_setup.sql:105-109`).
- OTP del cajero **generado por el propio cliente** con `Math.random` y guardado directo (`PointOperationSetupScreen.tsx:64-98`).
- SSRF + fuga de errores en `verify-merchant-identity/index.ts:63-70,137`.
- Password = PIN de 4 dígitos (`LoginScreen.tsx:133`, `RegisterScreen.tsx:174`).
- Sesión no persistente por "token corrupto" sin resolver (`src/lib/supabase.ts:12`).

---

## 3. Respuestas a las preguntas del equipo auditor

1. **Si el comprador no confirma y el vendedor no responde:** el saldo queda retenido en un `safety_payments` en `active` **indefinidamente**. La "liberación automática a las 72 h" existe solo como texto en la UI (`BuyerTransactionDetailScreen.tsx:321`); no hay cron/job en el repo y el contador es una simulación local que reinicia al abrir la pantalla (`BuyerTransactionDetailScreen.tsx:17`). No hay flujo de reembolso en la app.
2. **Quién más puede mover fondos:** cualquier usuario con la anon key (pública) puede invocar `transfer_tokens` con el `p_sender_id` de otra cuenta — control: **ninguno** visible. Para el escrow solo puede responderlo el SQL de `complete_protected_payment`, que no fue entregado.
3. **Peor error posible:** débito sin respaldo (dinero al limbo) o auto-inflado de saldo (política de `balance`); detección: **no hay monitoreo, alertas ni ledger** en lo entregado — se enterarían únicamente por reclamo del usuario.
4. **Cómo se prueba un cambio antes de que llegue a los usuarios:** no hay entorno de staging, CI, ni tests; la app apunta a la única BD (producción) hardcodeada. No hay proceso evidenciable.
5. **Si uno de los responsables no está disponible un mes:** no. 0 commits, sin README de arranque, RPCs y tablas viviendo solo en la cuenta de Supabase, y el secreto en la máquina local.

---

## 4. Dictamen según el criterio del equipo auditor

**NO APTO para piloto.**

Concurren los tres disparadores de "No apto":

1. El camino real del dinero usa floats del cliente.
2. Saldo como campo único editable desde el teléfono.
3. Confianza en datos enviados por el cliente (montos, destinatario, IDs, OTP, `user_id` de KYC).

Además: ledger inexistente, escrow no versionado y secretos a un `git add` de filtrarse.

**Material pendiente que solo el equipo puede entregar:**

- Copia de la BD (tablas `safety_payments`, `cashier_points`, `cashier_transactions`, `verification_logs` y las 3 RPCs).
- Logs de pruebas internas.
- Procedimiento de despliegue y respaldo con evidencia de al menos un restore.
- Lista de accesos administrativos a servidor y base de datos.
- Rotación de la llave de Google + limpieza del working copy + regla en `.gitignore`.

---

## Anexo — Índice de evidencia por archivo

| Archivo | Hallazgo |
|---|---|
| `.google_creds.json` | Llave privada de Google Cloud en texto plano; no ignorada por Git |
| `supabase/functions/README.md:31` | La misma credencial de servicio pegada en el manual; deploy manual (`supabase functions deploy verify-kyc:37`) |
| `supabase/config.toml:2` | `verify-kyc` sin verificación de JWT |
| `supabase_schema.sql:15-22` | Perfiles públicos (teléfono/saldo); saldo editable por el dueño |
| `supabase_schema.sql:41-42` | Usuarios pueden insertar transacciones completadas a su gusto |
| `supabase_kyc_setup.sql:66-70` | Cualquiera puede aprobar su propio KYC (`USING (true)`) |
| `supabase_kyc_setup.sql:105-109` | Documentos KYC de todos visibles para cualquier usuario |
| `supabase/migrations/token_transfer_rpc.sql:2-7` | Transferencias sin validar la identidad del emisor |
| `supabase/functions/verify-kyc/index.ts:19,105,150-170` | `user_id` desde el cliente; OCR crudo en logs; escribe con service role |
| `supabase/functions/verify-merchant-identity/index.ts:63-70,118,137` | Descarga de URLs arbitrarias (SSRF); tabla `verification_logs` inexistente; `debug` filtrado |
| `src/lib/supabase.ts:5-6,12` | URL/anon key hardcodeadas; persistencia de sesión desactivada |
| `src/screens/KYCScreen.tsx:350-369` | Anon key duplicada; llamada manual a la función KYC |
| `src/screens/LoginScreen.tsx:133,144` | Password = PIN + '00'; `hasCompletedKyc=true` al ingresar |
| `src/screens/RegisterScreen.tsx:174` | Password = PIN + '00' |
| `src/screens/PaymentConfirmScreen.tsx:93-98,154-179` | Comisión y total en cliente; débito + insert no atómicos ("DINERO AL LIMBO") |
| `src/screens/BuyerTransactionDetailScreen.tsx:17,60-77,109-112,321` | RPC con parámetros del cliente; sin bloqueo de doble toque; mediación no persistida; 72 h solo en texto |
| `src/screens/PointOperationSetupScreen.tsx:64-98` | OTP y monto generados/guardados por el cliente |
| `src/screens/ProtectedOperationsScreen.tsx:27-38` | Filtrado por `buyer_id/seller_id` hecho en el cliente |
| `src/screens/CashierDashboardScreen.tsx:249,292` | RPCs `validate_cashier_otp` y `process_cashier_transaction` (no versionadas) |
| `app.json:24,45` + `src/screens/PointsMapScreen.tsx:11` | API key de Google Maps hardcodeada |
| `package.json` | Sin scripts de test, lint ni typecheck |

**Fin del informe.**
