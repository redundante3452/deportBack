# Verificación de identificadores de marcos (2026-11-17)

Cada ID citado en el informe del game day se verificó contra datos oficiales descargados el 2026-11-17.
Citar una técnica o contramedida inexistente se penaliza; por eso solo se usan los marcados como verificados.

| Fuente oficial | Versión / URL |
|---|---|
| MITRE ATT&CK Enterprise (STIX) | v20.1 — `github.com/mitre-attack/attack-stix-data` (`enterprise-attack.json`) |
| MITRE ATLAS | 5.6.0 — `github.com/mitre-atlas/atlas-data` (`dist/ATLAS.yaml`) |
| MITRE D3FEND | API `d3fend.mitre.org/api/technique/d3f:<Nombre>.json` |
| NIST SP 800-53 Rev. 5 | catálogo OSCAL — `github.com/usnistgov/oscal-content` |
| NIST SP 800-207 | PDF oficial `nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf`, sección 2.1 |
| OWASP Top 10 for LLM Applications | 2025 — `genai.owasp.org/llm-top-10/` |

## MITRE ATT&CK v20.1

| ID | Nombre oficial | Estado |
|---|---|---|
| T1078 | Valid Accounts | ✅ |
| T1078.004 | Cloud Accounts | ✅ |
| T1485 | Data Destruction | ✅ |
| T1486 | Data Encrypted for Impact | ✅ |
| T1565.001 | Stored Data Manipulation | ✅ |
| T1552 | Unsecured Credentials | ✅ |
| T1190 | Exploit Public-Facing Application | ✅ |
| T1048 | Exfiltration Over Alternative Protocol | ✅ |
| ~~T1562.008~~ | Disable or Modify Cloud Logs | ❌ **revocada** en v20.1 → usar **T1685.002 Disable or Modify Cloud Log** |

## MITRE ATLAS 5.6.0

| ID | Nombre oficial |
|---|---|
| AML.T0051 | LLM Prompt Injection ✅ |
| AML.T0051.000 | Direct ✅ |
| AML.T0051.001 | Indirect ✅ |
| AML.T0051.002 | Triggered ✅ |

## MITRE D3FEND

| ID | Nombre oficial | Uso en el E4 |
|---|---|---|
| D3-RAPA | Resource Access Pattern Analysis | alerta de borrado masivo (patrón anómalo de acceso a recursos) |
| D3-RD | Restore Database | restauración desde clon PITR |
| D3-RO | Restore Object | copia aislada versionada en el bucket |
| D3-DO | Decoy Object | honeytoken (deportista señuelo con alerta); verificado 2026-11-17 vía API de D3FEND |
| D3-UGLPA | User Geolocation Logon Pattern Analysis | ⚠️ existe, pero **no** corresponde al límite de borrados: no usar para el E4 |

El límite de borrados por llamador (HTTP 429) se describe por su función y se traza a NIST SC-5 / AC-3; no se le asigna un ID de D3FEND sin verificar.

## NIST SP 800-53 Rev. 5

| Control | Título oficial |
|---|---|
| AC-3 | Access Enforcement |
| AC-6 | Least Privilege |
| AC-7 | Unsuccessful Logon Attempts |
| AU-2 | Event Logging |
| AU-6 | Audit Record Review, Analysis, and Reporting |
| AU-9 | Protection of Audit Information |
| AU-12 | Audit Record Generation |
| CP-2 | Contingency Plan |
| CP-6 | Alternate Storage Site |
| CP-9 | System Backup |
| CP-10 | System Recovery and Reconstitution |
| IA-5 | Authenticator Management |
| IR-4 | Incident Handling |
| IR-5 | Incident Monitoring |
| SC-5 | Denial-of-service Protection |
| SC-7 | Boundary Protection |
| SI-4 | System Monitoring |
| SI-7 | Software, Firmware, and Information Integrity |

## NIST SP 800-207

Sección 2.1 "Tenets of Zero Trust": 7 principios verificados en el PDF oficial (p. ej. 3: acceso por sesión con
mínimo privilegio; 4: acceso determinado por política dinámica). Se citan por número y paráfrasis.

## ISO/IEC 27001:2022 Anexo A

El texto oficial es de pago; los títulos se tomaron de fuentes secundarias coincidentes y se marcan así en el informe:
8.13 Information backup · 8.15 Logging · 8.16 Monitoring activities · 5.24 / 5.26 gestión de incidentes ·
8.2 Privileged access rights · 8.3 Information access restriction.

## OWASP

- Top 10 for LLM Applications 2025: LLM01:2025 Prompt Injection … LLM10:2025 Unbounded Consumption ✅.
- Top 10 for Agentic Applications (ASI01–ASI10): no verificado en la fuente oficial; no citar hasta confirmarlo.
