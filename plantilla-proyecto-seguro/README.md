# Plantilla de proyecto seguro

Plantilla de repositorio para que **cada nuevo proyecto nazca con la política de seguridad ya puesta**: la guía para Claude Code, los hooks, el motor de comprobaciones y el gate de CI. Crea repos nuevos a partir de esta plantilla.

## Qué incluye

```
.
├── CLAUDE.md                     # Memoria de proyecto: se carga sola en cada sesion de Claude Code
├── .claude/
│   ├── settings.json             # Hooks: corren los checks rapidos al editar codigo
│   └── skills/
│       └── seguridad-aplicaciones/
│           └── SKILL.md          # La skill: guia de autoria segura
├── security/
│   ├── policy.yml                # FUENTE UNICA DE VERDAD (los 27 controles como datos)
│   ├── .semgrep.yml              # Reglas SAST de arranque
│   ├── attestation.md            # Atestacion firmada de los controles runtime
│   └── checks/
│       ├── run_all.sh            # Orquestador -> exit 0/1 (contrato del gate)
│       ├── check_secrets.sh      # INFO-06
│       ├── check_sast.sh         # INJ-03/05, AUTH-03, INFO-04...
│       └── check_headers.sh      # HDR-*, SESS-01, INFO-01
├── azure-pipelines.yml           # Gate de CI (Azure DevOps, primario)
├── .github/workflows/
│   └── security-gate.yml         # Gate de CI (GitHub Actions, alternativo)
└── .gitignore
```

## Las tres capas (y cuál obliga)

1. **Autoría (blanda):** `CLAUDE.md` + la skill guían a Claude Code para escribir código que cumple por defecto.
2. **En sesión (semiblanda):** los hooks de `.claude/settings.json` corren los checks rápidos al editar, para ver los problemas antes del commit.
3. **Gate de CI (dura, obligatoria):** el workflow ejecuta `security/checks/run_all.sh` en cada PR. Si falla, **no se puede fusionar**.

> La obligatoriedad **no** nace del pipeline, nace de la **protección de rama**. Ejecutar los checks no basta: hay que marcar el gate como *check requerido* sobre la rama protegida y restringir quién puede modificar esa regla. Sin ese paso, el gate es un aviso, no una barrera.

## Puesta en marcha (una vez por repo)

1. Crea el repo desde esta plantilla.
2. **Marca el gate como requerido:**
   - Azure DevOps: *Branch policies* → *Build validation* → añade `azure-pipelines.yml` como requerido en `main`/`release/*`.
   - GitHub: *Settings* → *Branches* → *Branch protection rule* → *Require status checks* → `security`.
3. Para proyectos **con backend (APP)**: publica un preview en CI y expón su URL como `PREVIEW_URL`, para que el check de cabeceras se ejecute de verdad.
4. (Despliegue) Exige la **atestación firmada** (`security/attestation.md`) como check del entorno de producción, para cubrir los controles `runtime`.

## Uso local

```bash
# todo el gate
bash security/checks/run_all.sh

# un check suelto
bash security/checks/check_headers.sh https://mi-preview
```

## Herramientas recomendadas

Los scripts funcionan sin dependencias (usan `grep`/`curl`), pero el veredicto es mucho más fiable con:

- **gitleaks** → escaneo de secretos (INFO-06). Si está instalado, `check_secrets.sh` lo usa.
- **semgrep** → SAST autoritativo (INJ/AUTH/INFO-04). Si está instalado, manda sobre los greps heurísticos.

Sin estas herramientas, el fallback heurístico marca los casos de alta confianza como fallo y el resto como "revisar".

## Mantener sincronizado

`security/policy.yml` es la fuente de verdad. Si añades o cambias un control, actualiza también la skill (`SKILL.md`) y el script correspondiente en `security/checks/`. Las tres piezas deben contar la misma historia.

## Nota de producto

Los detalles exactos de hooks, `CLAUDE.md`, *settings* gestionadas por la organización y empaquetado/distribución de skills evolucionan. Antes de fijar la implementación, confírmalos en la documentación de Claude Code: https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md
